import type { Channel, M3UPlaylist, M3UParseOptions } from '@/types/tv';

const defaultOptions: M3UParseOptions = {
  filterOffline: true,
  filterHeaders: true,
  defaultCountry: 'Brasil',
};

export function parseM3U(content: string, options: M3UParseOptions = {}): M3UPlaylist {
  const opts = { ...defaultOptions, ...options };
  const lines = content.split('\n');
  const channels: Channel[] = [];
  let currentChannel: Partial<Channel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      // Parse channel info
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupTitleMatch = line.match(/group-title="([^"]*)"/);
      const tvgCountryMatch = line.match(/tvg-country="([^"]*)"/);
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);

      // Channel name is after the last comma
      let nameMatch = line.split(',').pop()?.trim() || '';

      // Limpar tags [COLOR ...] do nome
      nameMatch = nameMatch.replace(/\[COLOR[^\]]*\]/gi, '').replace(/\[\/COLOR\]/gi, '').trim();

      // Ignorar linhas que são apenas cabeçalhos/separadores
      if (opts.filterHeaders && isHeaderLine(nameMatch)) {
        currentChannel = null;
        continue;
      }

      // Ignorar canais marcados como OFF
      if (opts.filterOffline && nameMatch.toLowerCase().includes('(off)')) {
        currentChannel = null;
        continue;
      }

      // Limpar (ON) do nome se existir
      nameMatch = nameMatch.replace(/\s*\(ON\)\s*/gi, '').trim();

      const channelName = tvgNameMatch ? tvgNameMatch[1] : nameMatch || 'Canal sem nome';
      const groupTitle = groupTitleMatch ? groupTitleMatch[1].trim() : '';
      const category = detectCategory(groupTitle, channelName);
      const country = detectCountry(channelName, tvgCountryMatch?.[1] || '', opts.defaultCountry);

      currentChannel = {
        id: tvgIdMatch ? tvgIdMatch[1] : `channel_${channels.length}`,
        name: channelName,
        logo: tvgLogoMatch ? tvgLogoMatch[1] : '',
        country,
        category,
        url: '',
      };
    } else if (line && !line.startsWith('#') && currentChannel) {
      // This is the stream URL - validar URL
      const url = line.trim();

      if (isValidStreamUrl(url)) {
        currentChannel.url = url;
        channels.push(currentChannel as Channel);
      }
      currentChannel = null;
    }
  }

  // Extract unique countries and categories
  const countries = [...new Set(channels.map((ch) => ch.country))].sort();
  const categories = [...new Set(channels.map((ch) => ch.category))].sort();

  return { channels, countries, categories };
}

function isHeaderLine(name: string): boolean {
  const headerPatterns = [
    /^\(.*\)$/,
    /^CANAIS\s+(DE\s+)?/i,
    /^TV\s+ABERTA$/i,
    /^NOTICIAS$/i,
    /^ESPORTES$/i,
    /^FILMES$/i,
    /^SERIES$/i,
    /^INFANTIL$/i,
    /^ADULTO$/i,
    /^RADIOS?\s*(AM|FM)?/i,
    /^WEB\s*TV$/i,
    /^TOP\s+MUSICAS$/i,
    /^\s*$/,
  ];

  return headerPatterns.some((pattern) => pattern.test(name));
}

function isValidStreamUrl(url: string): boolean {
  if (!url || url.length < 10) return false;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;

  try {
    const urlObj = new URL(url);
    return urlObj.hostname.length >= 3;
  } catch {
    return false;
  }
}

function detectCategory(groupTitle: string, channelName: string): string {
  const group = groupTitle.toLowerCase();
  const name = channelName.toLowerCase();

  const categoryMap: Record<string, string> = {
    'tv aberta': 'TV Aberta',
    'canal aberto': 'TV Aberta',
    'canais abertos': 'TV Aberta',
    abertos: 'TV Aberta',
    abertas: 'TV Aberta',
    noticias: 'Notícias',
    notícias: 'Notícias',
    jornalismo: 'Notícias',
    'abertas-noticias': 'Notícias',
    news: 'Notícias',
    esportes: 'Esportes',
    esporte: 'Esportes',
    sports: 'Esportes',
    sport: 'Esportes',
    filmes: 'Filmes',
    filme: 'Filmes',
    movies: 'Filmes',
    cinema: 'Filmes',
    cine: 'Filmes',
    series: 'Séries',
    série: 'Séries',
    infantil: 'Infantil',
    kids: 'Infantil',
    desenhos: 'Infantil',
    documentarios: 'Documentários',
    documentário: 'Documentários',
    documentary: 'Documentários',
    religioso: 'Religioso',
    religiosos: 'Religioso',
    gospel: 'Religioso',
    musica: 'Música',
    música: 'Música',
    music: 'Música',
    variedades: 'Variedades',
    entretenimento: 'Entretenimento',
    adulto: 'Adulto',
    adult: 'Adulto',
    '+18': 'Adulto',
    radio: 'Rádio',
    rádio: 'Rádio',
    'web tv': 'Web TV',
    webtv: 'Web TV',
  };

  // Try by group-title first
  for (const [key, value] of Object.entries(categoryMap)) {
    if (group.includes(key)) {
      return value;
    }
  }

  // Try by channel name
  if (name.includes('news') || name.includes('noticias') || name.includes('cnn') || name.includes('jornal')) {
    return 'Notícias';
  } else if (name.includes('sport') || name.includes('espn') || name.includes('futebol') || name.includes('combate')) {
    return 'Esportes';
  } else if (name.includes('music') || name.includes('mtv') || name.includes('musica')) {
    return 'Música';
  } else if (name.includes('kids') || name.includes('cartoon') || name.includes('nick') || name.includes('disney') || name.includes('infantil')) {
    return 'Infantil';
  } else if (name.includes('movie') || name.includes('cine') || name.includes('film') || name.includes('hbo') || name.includes('telecine')) {
    return 'Filmes';
  } else if (name.includes('document') || name.includes('discovery') || name.includes('nat geo') || name.includes('history')) {
    return 'Documentários';
  } else if (name.includes('canção nova') || name.includes('aparecida') || name.includes('rede vida') || name.includes('gospel')) {
    return 'Religioso';
  } else if (name.includes('globo') || name.includes('sbt') || name.includes('record') || name.includes('band') || name.includes('redetv')) {
    return 'TV Aberta';
  }

  return 'Outros';
}

function detectCountry(channelName: string, tvgCountry: string, defaultCountry?: string): string {
  if (tvgCountry?.trim()) {
    return tvgCountry.trim();
  }

  const name = channelName.toLowerCase();

  // Brazilian states
  const brazilianStates = [
    'sp', 'rj', 'mg', 'ba', 'rs', 'pr', 'sc', 'pe', 'ce', 'pa',
    'ma', 'go', 'pb', 'am', 'es', 'rn', 'al', 'pi', 'mt', 'ms',
    'se', 'ro', 'to', 'ac', 'ap', 'rr', 'df',
  ];

  for (const state of brazilianStates) {
    if (name.includes(` ${state}`) || name.endsWith(` ${state}`) || name.includes(`${state} `)) {
      return 'Brasil';
    }
  }

  // Brazilian channels
  const brazilianChannels = [
    'globo', 'sbt', 'record', 'band', 'redetv', 'cultura',
    'tv brasil', 'canção nova', 'aparecida', 'rede vida', 'jovem pan', 'cbn',
  ];

  for (const channel of brazilianChannels) {
    if (name.includes(channel)) {
      return 'Brasil';
    }
  }

  // Other countries
  if (name.includes('portugal') || name.includes('tvi') || name.includes('rtp') || name.includes('sic')) {
    return 'Portugal';
  } else if (name.includes('usa') || name.includes('american') || name.includes('cnn') || name.includes('fox news')) {
    return 'EUA';
  } else if (name.includes('france') || name.includes('tf1') || name.includes('france 2')) {
    return 'França';
  } else if (name.includes('espanha') || name.includes('spain') || name.includes('antena 3')) {
    return 'Espanha';
  }

  return defaultCountry || 'Brasil';
}

export async function fetchM3UPlaylist(url: string): Promise<M3UPlaylist> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch M3U playlist: ${response.status}`);
  }

  const content = await response.text();
  return parseM3U(content);
}

export function filterChannels(
  channels: Channel[],
  filters: { country?: string; category?: string; search?: string }
): Channel[] {
  return channels.filter((channel) => {
    const matchesCountry = !filters.country || channel.country === filters.country;
    const matchesCategory = !filters.category || channel.category === filters.category;
    const matchesSearch = !filters.search || channel.name.toLowerCase().includes(filters.search.toLowerCase());
    return matchesCountry && matchesCategory && matchesSearch;
  });
}
