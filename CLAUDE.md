# CLAUDE.md

Este arquivo fornece orientações ao Claude Code (claude.ai/code) ao trabalhar com código neste repositório.

## Comandos de Build e Desenvolvimento

```bash
npm run dev      # Iniciar servidor de desenvolvimento em localhost:3000
npm run build    # Build de produção
npm run start    # Iniciar servidor de produção
npm run lint     # Executar ESLint
```

## Visão Geral da Arquitetura

Superflix é uma plataforma de streaming em português brasileiro construída com Next.js 16 (App Router) que exibe filmes, séries e animes do TMDB, com reprodução de vídeo via SuperflixAPI.

### Grupos de Rotas

- `src/app/(main)/` - Layout principal com Header, Footer, MobileNav
- `src/app/(auth)/` - Páginas de login/registro com layout mínimo
- `src/app/api/` - Rotas da API REST para auth, histórico, admin e configurações

### Serviços Principais

- **Serviço TMDB** (`src/services/tmdb.ts`): Metadados de conteúdo, busca e descoberta com cache em memória (TTL de 10 minutos). Use os helpers `tmdb.getTitle()` e `tmdb.getReleaseDate()` já que filmes usam `title`/`release_date` enquanto séries usam `name`/`first_air_date`.

- **Parser M3U** (`src/services/m3u.ts`): Faz parsing de playlists M3U para canais de TV ao vivo. Filtra canais offline e linhas de cabeçalho, detecta automaticamente canais e categorias brasileiras.

- **SuperflixAPI**: URLs do player geradas via `superflixApi.getPlayerUrl()` - filmes em `/filme/{id}`, séries em `/serie/{id}/{season}/{episode}`.

### Fluxo de Autenticação

1. Middleware (`src/middleware.ts`) protege rotas `/profile` e `/admin` via cookie `auth_token`
2. Rotas da API usam HOFs `requireAuth()` ou `requireAdmin()` de `src/lib/auth.ts` para validação JWT
3. Estado do cliente gerenciado via `AuthContext` com persistência em localStorage

### Banco de Dados

Usa `@vercel/postgres` com modo offline automático (fallback para memória quando `POSTGRES_URL` não está definido). Tabelas: `users`, `watch_history`, `favorites`, `system_settings`, `admin_logs`.

### Providers de Contexto

Envolvidos em ordem via `src/components/Providers.tsx`:
- `ThemeProvider` - Modo escuro/claro
- `AuthProvider` - Estado da sessão do usuário
- `ToastProvider` - Sistema de notificações

### Alias de Caminho

Use `@/*` para importar de `src/*` (configurado em tsconfig.json).

## Variáveis de Ambiente

- `NEXT_PUBLIC_TMDB_API_KEY` - Obrigatório para metadados de conteúdo
- `POSTGRES_URL` - Conexão com banco (opcional, usa memória como fallback)
- `JWT_SECRET` - Assinatura de tokens de auth (padrão para dev)

## Estilização

Tailwind CSS v4 com `@tailwindcss/postcss`. Tema escuro é padrão (background `#0f0f0f`).

## Tipos de Conteúdo

Conteúdo do TMDB usa campos polimórficos:
- Filmes: `title`, `release_date`
- Séries: `name`, `first_air_date`
- Sempre verifique `media_type` ou use funções helper para lidar com ambos.
