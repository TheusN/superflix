# Superflix

Plataforma de streaming para filmes, séries e animes construída com Next.js 16.

## Tecnologias

- **Next.js 16** - App Router
- **React 19** - UI
- **Tailwind CSS 4** - Estilos
- **Vercel Postgres** - Banco de dados
- **TMDB API** - Metadados de conteúdo
- **HLS.js** - Player de vídeo

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Executar linter
npm run lint
```

Acesse [http://localhost:3000](http://localhost:3000) para ver o resultado.

## Variáveis de Ambiente

Crie um arquivo `.env.local` com:

```env
# Obrigatório - API do TMDB para metadados
NEXT_PUBLIC_TMDB_API_KEY=sua_chave_aqui

# Opcional - Banco de dados (sem isso, usa memória)
POSTGRES_URL=sua_connection_string

# Opcional - Segredo JWT (tem valor padrão para dev)
JWT_SECRET=seu_segredo_aqui
```

## Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/        # Páginas de login/registro
│   ├── (main)/        # Páginas principais com layout completo
│   └── api/           # Rotas da API REST
├── components/        # Componentes React
├── context/           # Providers (Auth, Theme, Toast)
├── lib/               # Utilitários e configurações
├── services/          # Serviços externos (TMDB, M3U)
└── types/             # Definições TypeScript
```

## Deploy na Vercel

O projeto está configurado para deploy na Vercel com:
- Região: São Paulo (gru1)
- Headers de segurança configurados
- CORS habilitado para API

### Variáveis Necessárias na Vercel

1. `NEXT_PUBLIC_TMDB_API_KEY` - Chave da API TMDB
2. `POSTGRES_URL` - String de conexão do Vercel Postgres (opcional)
3. `JWT_SECRET` - Segredo para tokens de autenticação
