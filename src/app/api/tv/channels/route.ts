import { NextResponse } from 'next/server';

const EMBEDTV_API_URL = 'https://embedtv.best/channels.php';

interface EmbedTVCategory {
  id: number;
  name: string;
}

interface EmbedTVChannel {
  id: string;
  name: string;
  image: string;
  categories: number[];
  url: string;
}

interface EmbedTVResponse {
  categories: EmbedTVCategory[];
  channels: EmbedTVChannel[];
}

// Cache em memória
let cachedData: EmbedTVResponse | null = null;
let cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos

export async function GET() {
  try {
    // Retornar cache se ainda válido
    if (cachedData && Date.now() - cacheTime < CACHE_TTL) {
      return NextResponse.json(cachedData);
    }

    const response = await fetch(EMBEDTV_API_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 600 }, // Cache por 10 minutos no Next.js
    });

    if (!response.ok) {
      throw new Error(`Erro ao carregar canais: ${response.status}`);
    }

    const data: EmbedTVResponse = await response.json();

    // Atualizar cache
    cachedData = data;
    cacheTime = Date.now();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching TV channels:', error);

    // Retornar cache antigo se disponível
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    return NextResponse.json(
      { error: 'Erro ao carregar canais de TV' },
      { status: 500 }
    );
  }
}
