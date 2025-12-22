import { NextRequest, NextResponse } from 'next/server';

// Domínios permitidos para proxy (segurança)
const ALLOWED_DOMAINS = [
  'superflixapi.run',
  'superflixapi.top',
  'embedtv.best',
  'www1.embedtv.best',
  'image.tmdb.org',
];

function isAllowedDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ALLOWED_DOMAINS.some(domain =>
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'URL é obrigatória' },
      { status: 400 }
    );
  }

  // Verificar se o domínio é permitido
  if (!isAllowedDomain(url)) {
    return NextResponse.json(
      { error: 'Domínio não permitido' },
      { status: 403 }
    );
  }

  try {
    // Fetch direto pelo servidor (bypassa bloqueios do cliente)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': new URL(url).origin,
      },
      cache: 'no-store',
    });

    // Pegar o content-type original
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Se for HTML, retornar como texto
    if (contentType.includes('text/html')) {
      const html = await response.text();
      return new NextResponse(html, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Para outros tipos, fazer streaming
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Erro ao acessar recurso' },
      { status: 500 }
    );
  }
}

// Suportar POST para APIs
export async function POST(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'URL é obrigatória' },
      { status: 400 }
    );
  }

  if (!isAllowedDomain(url)) {
    return NextResponse.json(
      { error: 'Domínio não permitido' },
      { status: 403 }
    );
  }

  try {
    const body = await request.text();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Content-Type': request.headers.get('content-type') || 'application/json',
        'Referer': new URL(url).origin,
      },
      body,
      cache: 'no-store',
    });

    const contentType = response.headers.get('content-type') || 'application/json';
    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Erro ao acessar recurso' },
      { status: 500 }
    );
  }
}

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
