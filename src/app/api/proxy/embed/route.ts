import { NextRequest, NextResponse } from 'next/server';
import { resolveWithCloudflare, fetchWithResolvedDNS } from '@/lib/dns-resolver';

// Domínios de embed permitidos
const ALLOWED_EMBED_DOMAINS = [
  'superflixapi.run',
  'superflixapi.buzz',
  'superflixapi.top',
  'embedtv.best',
  'www1.embedtv.best',
];

// Domínios que devem ser proxied (bloqueados pelo DNS local)
const PROXY_DOMAINS = [
  'superflixapi.run',
  'superflixapi.buzz',
  'superflixapi.top',
  'embedtv.best',
  'www1.embedtv.best',
];

function isAllowedDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ALLOWED_EMBED_DOMAINS.some(
      (domain) => urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

function shouldProxyUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return PROXY_DOMAINS.some(
      (domain) => urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

function rewriteUrlsToProxy(html: string, baseOrigin: string): string {
  // Função para criar URL de proxy
  const proxyUrl = (url: string) => `/api/proxy/asset?url=${encodeURIComponent(url)}`;

  // Reescrever URLs em atributos src e href que apontam para domínios bloqueados
  html = html.replace(
    /(src|href)=["'](https?:\/\/[^"']+)["']/gi,
    (match, attr, url) => {
      if (shouldProxyUrl(url)) {
        return `${attr}="${proxyUrl(url)}"`;
      }
      return match;
    }
  );

  // Reescrever URLs relativas (sem http/https) para URLs absolutas e então para proxy
  html = html.replace(
    /(src|href)=["'](?!https?:\/\/|data:|\/api\/|#|javascript:)([^"']+)["']/gi,
    (match, attr, path) => {
      // Construir URL absoluta
      let absoluteUrl: string;
      if (path.startsWith('//')) {
        absoluteUrl = 'https:' + path;
      } else if (path.startsWith('/')) {
        absoluteUrl = baseOrigin + path;
      } else {
        absoluteUrl = baseOrigin + '/' + path;
      }

      if (shouldProxyUrl(absoluteUrl)) {
        return `${attr}="${proxyUrl(absoluteUrl)}"`;
      }
      return `${attr}="${absoluteUrl}"`;
    }
  );

  // Injetar script para interceptar fetch e XMLHttpRequest
  const interceptorScript = `
<script>
(function() {
  const PROXY_DOMAINS = ${JSON.stringify(PROXY_DOMAINS)};

  function shouldProxy(url) {
    try {
      const urlObj = new URL(url, window.location.origin);
      return PROXY_DOMAINS.some(d => urlObj.hostname === d || urlObj.hostname.endsWith('.' + d));
    } catch { return false; }
  }

  function proxyUrl(url) {
    return '/api/proxy/asset?url=' + encodeURIComponent(url);
  }

  // Interceptar fetch
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    let url = typeof input === 'string' ? input : input.url;
    if (shouldProxy(url)) {
      url = proxyUrl(url);
      if (typeof input === 'string') {
        input = url;
      } else {
        input = new Request(url, input);
      }
    }
    return originalFetch.call(this, input, init);
  };

  // Interceptar XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    if (shouldProxy(url)) {
      url = proxyUrl(url);
    }
    return originalOpen.call(this, method, url, ...args);
  };
})();
</script>`;

  // Injetar o script no head
  if (html.includes('<head>')) {
    html = html.replace('<head>', '<head>' + interceptorScript);
  } else if (html.includes('<head ')) {
    html = html.replace(/<head([^>]*)>/, '<head$1>' + interceptorScript);
  } else {
    // Se não tiver head, adicionar no início
    html = interceptorScript + html;
  }

  return html;
}

export const dynamic = 'force-dynamic';

// Função para seguir redirects com DNS customizado
async function fetchWithRedirects(url: string, maxRedirects = 5): Promise<{ status: number; body: string } | null> {
  let currentUrl = url;
  let redirectCount = 0;

  while (redirectCount < maxRedirects) {
    const urlObj = new URL(currentUrl);
    const hostname = urlObj.hostname;

    // Resolver DNS via Cloudflare
    const resolvedIP = await resolveWithCloudflare(hostname);
    if (!resolvedIP) {
      console.error(`[Proxy] DNS failed for: ${hostname}`);
      return null;
    }

    console.log(`[Proxy] ${hostname} -> ${resolvedIP}`);

    try {
      const result = await fetchWithResolvedDNS(currentUrl, resolvedIP);

      // Se for redirect, seguir
      if (result.status >= 300 && result.status < 400 && result.redirect) {
        console.log(`[Proxy] Redirect ${result.status} -> ${result.redirect}`);
        currentUrl = result.redirect.startsWith('http')
          ? result.redirect
          : new URL(result.redirect, currentUrl).href;

        // Verificar se o novo domínio é permitido
        if (!isAllowedDomain(currentUrl)) {
          console.error(`[Proxy] Redirect para domínio não permitido: ${currentUrl}`);
          return null;
        }

        redirectCount++;
        continue;
      }

      return { status: result.status, body: result.body };
    } catch (error) {
      console.error(`[Proxy] Fetch error:`, error);
      return null;
    }
  }

  console.error(`[Proxy] Too many redirects`);
  return null;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
  }

  if (!isAllowedDomain(url)) {
    return NextResponse.json({ error: 'Domínio não permitido' }, { status: 403 });
  }

  try {
    const result = await fetchWithRedirects(url);

    if (!result) {
      return NextResponse.json({ error: 'Erro ao acessar o conteúdo' }, { status: 502 });
    }

    if (result.status !== 200) {
      return NextResponse.json(
        { error: `Servidor retornou status ${result.status}` },
        { status: result.status }
      );
    }

    let html = result.body;

    // Determinar a base URL original
    const urlObj = new URL(url);
    const baseOrigin = urlObj.origin;

    // Reescrever todas as URLs para usar o proxy
    html = rewriteUrlsToProxy(html, baseOrigin);

    // Adicionar base tag se não existir (para recursos não capturados)
    if (!html.includes('<base')) {
      html = html.replace('<head>', `<head><base href="${baseOrigin}/">`);
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'X-Frame-Options': 'ALLOWALL',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do proxy', details: String(error) },
      { status: 500 }
    );
  }
}
