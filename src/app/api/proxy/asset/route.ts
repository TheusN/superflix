import { NextRequest, NextResponse } from 'next/server';
import { resolveWithCloudflare, fetchWithResolvedDNS } from '@/lib/dns-resolver';

// Domínios permitidos para assets
const ALLOWED_ASSET_DOMAINS = [
  'superflixapi.run',
  'superflixapi.buzz',
  'superflixapi.top',
  'embedtv.best',
  'www1.embedtv.best',
  // CDNs comuns usados pelos players
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'unpkg.com',
];

function isAllowedDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ALLOWED_ASSET_DOMAINS.some(
      (domain) => urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
  }

  // Para CDNs públicos, tentar fetch normal primeiro
  const urlObj = new URL(url);
  const isCDN = ['cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'unpkg.com'].some(
    cdn => urlObj.hostname === cdn || urlObj.hostname.endsWith('.' + cdn)
  );

  if (isCDN) {
    // CDNs geralmente não são bloqueados, fetch direto
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': '*/*',
        },
      });

      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const data = await response.arrayBuffer();

      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch {
      // Se falhar, tentar com DNS resolver
    }
  }

  if (!isAllowedDomain(url)) {
    return NextResponse.json({ error: 'Domínio não permitido' }, { status: 403 });
  }

  try {
    const hostname = urlObj.hostname;

    // Resolver DNS via Cloudflare
    const resolvedIP = await resolveWithCloudflare(hostname);
    if (!resolvedIP) {
      return NextResponse.json({ error: 'DNS resolution failed' }, { status: 502 });
    }

    const result = await fetchWithResolvedDNS(url, resolvedIP);

    // Seguir redirects se necessário
    if (result.status >= 300 && result.status < 400 && result.redirect) {
      const redirectUrl = result.redirect.startsWith('http')
        ? result.redirect
        : new URL(result.redirect, url).href;

      // Redirecionar através do proxy
      return NextResponse.redirect(`/api/proxy/asset?url=${encodeURIComponent(redirectUrl)}`);
    }

    // Detectar content-type
    let contentType = 'application/octet-stream';
    const headerContentType = result.headers['content-type'];
    if (headerContentType) {
      contentType = Array.isArray(headerContentType) ? headerContentType[0] : headerContentType;
    } else {
      // Inferir do path
      const path = urlObj.pathname.toLowerCase();
      if (path.endsWith('.js')) contentType = 'application/javascript';
      else if (path.endsWith('.css')) contentType = 'text/css';
      else if (path.endsWith('.m3u8')) contentType = 'application/vnd.apple.mpegurl';
      else if (path.endsWith('.ts')) contentType = 'video/mp2t';
      else if (path.endsWith('.json')) contentType = 'application/json';
      else if (path.endsWith('.png')) contentType = 'image/png';
      else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (path.endsWith('.gif')) contentType = 'image/gif';
      else if (path.endsWith('.svg')) contentType = 'image/svg+xml';
      else if (path.endsWith('.woff') || path.endsWith('.woff2')) contentType = 'font/woff2';
    }

    return new NextResponse(result.body, {
      status: result.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[Asset Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao acessar recurso', details: String(error) },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
