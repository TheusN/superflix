/**
 * DNS Resolver usando Cloudflare DNS over HTTPS
 * Contorna bloqueios de DNS local
 */

import https from 'https';
import zlib from 'zlib';

interface DNSAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DNSResponse {
  Status: number;
  Answer?: DNSAnswer[];
}

// Cache de DNS
const dnsCache = new Map<string, { ip: string; expires: number }>();

/**
 * Resolve um hostname usando Cloudflare DNS over HTTPS
 */
export async function resolveWithCloudflare(hostname: string): Promise<string | null> {
  // Verificar cache
  const cached = dnsCache.get(hostname);
  if (cached && cached.expires > Date.now()) {
    return cached.ip;
  }

  return new Promise((resolve) => {
    https.get(
      `https://1.1.1.1/dns-query?name=${hostname}&type=A`,
      { headers: { Accept: 'application/dns-json' } },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json: DNSResponse = JSON.parse(data);
            const aRecord = json.Answer?.find((a) => a.type === 1);

            if (aRecord) {
              const ip = aRecord.data;
              const ttl = Math.max(aRecord.TTL * 1000, 60000); // mínimo 1 minuto

              dnsCache.set(hostname, {
                ip,
                expires: Date.now() + ttl,
              });

              resolve(ip);
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        });
      }
    ).on('error', () => resolve(null));
  });
}

/**
 * Faz uma requisição HTTPS usando IP resolvido via Cloudflare DNS
 */
export function fetchWithResolvedDNS(
  url: string,
  resolvedIP: string,
  options: { followRedirects?: boolean; maxRedirects?: number; referer?: string } = {}
): Promise<{ status: number; body: string; headers: Record<string, string | string[] | undefined>; redirect?: string }> {
  const { followRedirects = false, referer } = options;

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const reqOptions = {
      hostname: resolvedIP,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        Host: urlObj.hostname,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        // Headers que indicam que está sendo carregado em um iframe
        'Sec-Fetch-Dest': 'iframe',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        // Referer do site que está embedando
        Referer: referer || 'https://superflix.app/',
        Origin: referer ? new URL(referer).origin : 'https://superflix.app',
      },
      rejectUnauthorized: false,
      servername: urlObj.hostname,
    };

    const req = https.request(reqOptions, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const encoding = res.headers['content-encoding'];

        // Descomprimir se necessário
        let bodyPromise: Promise<string>;

        if (encoding === 'gzip') {
          bodyPromise = new Promise((resolveBody, rejectBody) => {
            zlib.gunzip(buffer, (err, result) => {
              if (err) rejectBody(err);
              else resolveBody(result.toString('utf-8'));
            });
          });
        } else if (encoding === 'deflate') {
          bodyPromise = new Promise((resolveBody, rejectBody) => {
            zlib.inflate(buffer, (err, result) => {
              if (err) rejectBody(err);
              else resolveBody(result.toString('utf-8'));
            });
          });
        } else if (encoding === 'br') {
          bodyPromise = new Promise((resolveBody, rejectBody) => {
            zlib.brotliDecompress(buffer, (err, result) => {
              if (err) rejectBody(err);
              else resolveBody(result.toString('utf-8'));
            });
          });
        } else {
          bodyPromise = Promise.resolve(buffer.toString('utf-8'));
        }

        bodyPromise.then((body) => {
          const result = {
            status: res.statusCode || 0,
            body,
            headers: res.headers as Record<string, string | string[] | undefined>,
            redirect: res.headers.location,
          };

          // Se for redirect e followRedirects está habilitado
          if (followRedirects && res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            // Retorna info do redirect para o caller decidir
            resolve(result);
          } else {
            resolve(result);
          }
        }).catch((err) => {
          reject(err);
        });
      });
    });

    req.on('error', (e) => reject(e));
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

/**
 * Limpa o cache de DNS
 */
export function clearDNSCache(): void {
  dnsCache.clear();
}
