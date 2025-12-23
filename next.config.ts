import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Marcar pg como pacote externo do servidor para evitar problemas com bundlers
  serverExternalPackages: ['pg', 'pg-native'],
  // Desabilitar Turbopack em desenvolvimento para compatibilidade com pg no Windows
  turbopack: {
    rules: {},
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: '**.postimg.org',
      },
      {
        protocol: 'http',
        hostname: '**.postimg.org',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'lut.im',
      },
    ],
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
