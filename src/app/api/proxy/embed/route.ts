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
  // Domínios de stream HLS comuns
  'cdn.superflixapi.run',
  'stream.superflixapi.run',
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
  // Importante: só reescreve se a URL é completa (não tem concatenação JS como " + variavel)
  html = html.replace(
    /(src|href)=(["'])(https?:\/\/[^"']+)\2(?!\s*\+)/gi,
    (match, attr, quote, url) => {
      if (shouldProxyUrl(url)) {
        return `${attr}=${quote}${proxyUrl(url)}${quote}`;
      }
      return match;
    }
  );

  // Reescrever URLs relativas (sem http/https) para URLs absolutas e então para proxy
  // Importante: só reescreve se a URL é completa (não tem concatenação JS)
  html = html.replace(
    /(src|href)=(["'])(?!https?:\/\/|data:|\/api\/|#|javascript:)([^"']+)\2(?!\s*\+)/gi,
    (match, attr, quote, path) => {
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
        return `${attr}=${quote}${proxyUrl(absoluteUrl)}${quote}`;
      }
      return `${attr}=${quote}${absoluteUrl}${quote}`;
    }
  );

  // Injetar script para interceptar fetch, XMLHttpRequest e HLS
  const interceptorScript = `
<script>
(function() {
  const PROXY_DOMAINS = ${JSON.stringify(PROXY_DOMAINS)};
  const PROXY_BASE = '/api/proxy/';

  // URLs que devem ser bloqueadas (causam erros de CORS ou são desnecessárias)
  const BLOCKED_URLS = [
    '/cdn-cgi/rum',           // Cloudflare RUM - causa erro de CORS
    'cdn-cgi/rum',
    '.ttf',                   // Fontes que podem falhar
    '.woff',
    '.woff2'
  ];

  // Domínios de WebSocket P2P que podem falhar
  const BLOCKED_WS_DOMAINS = [
    'p2p.s27-usa-cloudfront-net.online',
    'p2p.',
    'tracker.',
    'wss://'
  ];

  function shouldBlock(url) {
    if (!url) return false;
    const urlStr = url.toString().toLowerCase();
    return BLOCKED_URLS.some(blocked => urlStr.includes(blocked));
  }

  function shouldProxy(url) {
    try {
      // Converter URL relativa para absoluta
      const urlObj = new URL(url, window.location.origin);
      // Verificar se é um domínio que deve ser proxiado
      return PROXY_DOMAINS.some(d => urlObj.hostname === d || urlObj.hostname.endsWith('.' + d));
    } catch { return false; }
  }

  function proxyUrl(url, type) {
    // Determinar qual endpoint usar baseado no tipo
    const endpoint = type === 'hls' ? 'hls' : 'asset';
    return PROXY_BASE + endpoint + '?url=' + encodeURIComponent(url);
  }

  function isHlsUrl(url) {
    return url.includes('.m3u8') || url.includes('.ts');
  }

  // Interceptar fetch - bloquear URLs problemáticas
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    let url = typeof input === 'string' ? input : input.url;

    // Bloquear URLs que causam erros
    if (shouldBlock(url)) {
      return Promise.resolve(new Response('', { status: 200 }));
    }

    if (shouldProxy(url)) {
      const type = isHlsUrl(url) ? 'hls' : 'asset';
      url = proxyUrl(url, type);
      if (typeof input === 'string') {
        input = url;
      } else {
        input = new Request(url, input);
      }
    }
    return originalFetch.call(this, input, init);
  };

  // Interceptar XMLHttpRequest - bloquear URLs problemáticas
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._blockedXhr = shouldBlock(url);
    this._xhrOpened = !this._blockedXhr;

    if (this._blockedXhr) {
      // Abrir para uma URL dummy para evitar erros de estado
      return originalOpen.call(this, 'GET', 'data:text/plain,', true);
    }

    if (shouldProxy(url)) {
      const type = isHlsUrl(url) ? 'hls' : 'asset';
      url = proxyUrl(url, type);
    }
    return originalOpen.call(this, method, url, ...args);
  };

  XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
    if (this._blockedXhr) return; // Ignorar headers para XHR bloqueados
    return originalSetRequestHeader.call(this, name, value);
  };

  XMLHttpRequest.prototype.send = function(...args) {
    if (this._blockedXhr) {
      // Simular resposta bem-sucedida
      const self = this;
      setTimeout(() => {
        Object.defineProperty(self, 'status', { value: 200, writable: true });
        Object.defineProperty(self, 'readyState', { value: 4, writable: true });
        Object.defineProperty(self, 'responseText', { value: '', writable: true });
        Object.defineProperty(self, 'response', { value: '', writable: true });
        if (self.onreadystatechange) self.onreadystatechange();
        if (self.onload) self.onload();
      }, 0);
      return;
    }
    return originalSend.apply(this, args);
  };

  // Interceptar WebSocket para bloquear conexões P2P problemáticas
  const OriginalWebSocket = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    const urlStr = url.toString().toLowerCase();
    const shouldBlockWs = BLOCKED_WS_DOMAINS.some(d => urlStr.includes(d));

    if (shouldBlockWs) {
      // Criar um WebSocket falso que não faz nada
      const fakeWs = {
        url: url,
        readyState: 3, // CLOSED
        send: function() {},
        close: function() {},
        addEventListener: function() {},
        removeEventListener: function() {},
        onopen: null,
        onclose: null,
        onerror: null,
        onmessage: null
      };
      // Simular fechamento após um momento
      setTimeout(() => {
        if (fakeWs.onclose) fakeWs.onclose({ code: 1000, reason: 'blocked' });
      }, 100);
      return fakeWs;
    }

    return new OriginalWebSocket(url, protocols);
  };
  window.WebSocket.CONNECTING = 0;
  window.WebSocket.OPEN = 1;
  window.WebSocket.CLOSING = 2;
  window.WebSocket.CLOSED = 3;

  // Suprimir erros de console relacionados a recursos bloqueados
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  function shouldSuppressLog(args) {
    const msg = args.map(a => String(a)).join(' ').toLowerCase();
    return msg.includes('cors') ||
           msg.includes('cdn-cgi') ||
           msg.includes('websocket') ||
           msg.includes('net::err') ||
           msg.includes('.ttf') ||
           msg.includes('.woff') ||
           msg.includes('attestation') ||
           msg.includes('invalidstateerror') ||
           msg.includes('setrequestheader') ||
           msg.includes('topics') ||
           msg.includes('jsdelivr') ||
           msg.includes('blocked') ||
           msg.includes('failed to load');
  }

  console.error = function(...args) {
    if (shouldSuppressLog(args)) return;
    return originalConsoleError.apply(console, args);
  };

  console.warn = function(...args) {
    if (shouldSuppressLog(args)) return;
    return originalConsoleWarn.apply(console, args);
  };

  // Capturar erros globais não tratados
  window.addEventListener('error', function(e) {
    const msg = (e.message || '').toLowerCase();
    if (msg.includes('cors') ||
        msg.includes('ttf') ||
        msg.includes('woff') ||
        msg.includes('invalidstate') ||
        msg.includes('setrequestheader') ||
        msg.includes('jsdelivr')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // Capturar rejeições de Promise não tratadas
  window.addEventListener('unhandledrejection', function(e) {
    const msg = String(e.reason || '').toLowerCase();
    if (msg.includes('cors') ||
        msg.includes('ttf') ||
        msg.includes('woff') ||
        msg.includes('blocked') ||
        msg.includes('invalidstate')) {
      e.preventDefault();
      return false;
    }
  });

  // Interceptar createElement para capturar scripts dinâmicos
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(document, tagName);
    if (tagName.toLowerCase() === 'script' || tagName.toLowerCase() === 'img') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name, value) {
        if (name === 'src' && shouldProxy(value)) {
          value = proxyUrl(value, 'asset');
        }
        return originalSetAttribute.call(this, name, value);
      };
      // Também interceptar a propriedade src
      Object.defineProperty(element, 'src', {
        set: function(value) {
          if (shouldProxy(value)) {
            value = proxyUrl(value, 'asset');
          }
          this.setAttribute('src', value);
        },
        get: function() {
          return this.getAttribute('src');
        }
      });
    }
    return element;
  };

  console.log('[Superflix Proxy] Interceptors initialized');

  // Auto-unmute: Tentar desmutar vídeos quando o usuário interagir
  function tryUnmute() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      if (video.muted) {
        video.muted = false;
        console.log('[Superflix Proxy] Video unmuted');
      }
    });
  }

  // Observar novos elementos de vídeo
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeName === 'VIDEO') {
          // Quando um vídeo é adicionado, tentar desmutar após um delay
          setTimeout(() => {
            if (node.muted) {
              node.muted = false;
              console.log('[Superflix Proxy] New video unmuted');
            }
          }, 1000);
        }
      });
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Desmutar em qualquer interação do usuário
  ['click', 'touchstart', 'keydown'].forEach(event => {
    document.addEventListener(event, function unmuter() {
      tryUnmute();
      // Continuar tentando por alguns segundos após a interação
      setTimeout(tryUnmute, 500);
      setTimeout(tryUnmute, 1000);
      setTimeout(tryUnmute, 2000);
    }, { passive: true });
  });

  // Tentar desmutar periodicamente nos primeiros segundos
  let attempts = 0;
  const unmuteInterval = setInterval(() => {
    tryUnmute();
    attempts++;
    if (attempts > 10) clearInterval(unmuteInterval);
  }, 500);
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
async function fetchWithRedirects(url: string, referer: string, maxRedirects = 5): Promise<{ status: number; body: string } | null> {
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
      const result = await fetchWithResolvedDNS(currentUrl, resolvedIP, { referer });

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
    // Usar o referer da request ou o host do site
    const requestReferer = request.headers.get('referer') || request.headers.get('origin');
    const referer = requestReferer || `https://${request.headers.get('host') || 'superflix.app'}/`;

    const result = await fetchWithRedirects(url, referer);

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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'X-Frame-Options': 'ALLOWALL',
        'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' blob:; worker-src * blob:; style-src * 'unsafe-inline'; img-src * data: blob:; media-src * data: blob:; connect-src *; frame-src *;",
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
