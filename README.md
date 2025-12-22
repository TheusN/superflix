<p align="center">
  <img src="public/logo.png" alt="Superflix Logo" width="200" />
</p>

<h1 align="center">🎬 Superflix</h1>

<p align="center">
  <strong>Sua plataforma de streaming gratuita e open-source</strong>
</p>

<p align="center">
  <a href="https://superflix.omniwhats.com/">
    <img src="https://img.shields.io/badge/🌐_Demo_Live-superflix.omniwhats.com-00d26a?style=for-the-badge" alt="Live Demo" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwindcss" alt="Tailwind 4" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License" />
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-demo">Demo</a> •
  <a href="#-começando">Começando</a> •
  <a href="#-contribuindo">Contribuindo</a> •
  <a href="#-arquitetura">Arquitetura</a>
</p>

---

## 🎯 Sobre o Projeto

O **Superflix** é uma plataforma de streaming moderna desenvolvida em **Next.js 16** que permite assistir filmes, séries, animes e TV ao vivo. O projeto utiliza a API do **TMDB** para metadados e a **SuperflixAPI** para reprodução de conteúdo.

> **Criado por [@TheusNattan](https://github.com/TheusN)** - Desenvolvedor apaixonado por criar experiências incríveis.

### Por que Superflix?

- 🆓 **100% Gratuito** - Sem assinaturas, sem cobranças
- 🚀 **Super Rápido** - Otimizado com Next.js 16 e Turbopack
- 📱 **Responsivo** - Funciona perfeitamente em qualquer dispositivo
- 🌙 **Dark Mode** - Interface elegante e confortável
- 🔒 **Open Source** - Código aberto para a comunidade

---

## ✨ Features

### 🎬 Conteúdo
- **Filmes** - Catálogo completo com milhares de títulos
- **Séries** - Episódios organizados por temporada
- **Animes** - Seção dedicada para fãs de anime
- **TV ao Vivo** - Canais brasileiros em tempo real

### 🛠️ Funcionalidades
- 🔍 **Busca Inteligente** - Encontre qualquer conteúdo rapidamente
- 📅 **Calendário de Lançamentos** - Acompanhe novos episódios
- ❤️ **Favoritos** - Salve seus conteúdos preferidos
- 📊 **Histórico** - Continue de onde parou
- 👤 **Sistema de Contas** - Perfis personalizados
- 🔐 **Painel Admin** - Gerencie a plataforma

### ⚡ Tecnologia
- **Proxy Inteligente** - Bypass de restrições com DNS over HTTPS
- **HLS Streaming** - Reprodução suave e adaptativa
- **Cache Otimizado** - Carregamento ultra-rápido
- **PWA Ready** - Instale como aplicativo

---

## 🌐 Demo

Acesse a versão live do Superflix:

### 👉 [superflix.omniwhats.com](https://superflix.omniwhats.com/)

<p align="center">
  <img src="https://img.shields.io/badge/Status-Online-00d26a?style=for-the-badge" alt="Status Online" />
</p>

---

## 🚀 Começando

### Pré-requisitos

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **Conta TMDB** - [Criar conta](https://www.themoviedb.org/signup) (gratuito)

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/TheusN/superflix.git

# 2. Entre na pasta do projeto
cd superflix

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
cp .env.example .env.local
```

### Configuração

Edite o arquivo `.env.local`:

```env
# OBRIGATÓRIO - Pegue sua chave em: https://www.themoviedb.org/settings/api
NEXT_PUBLIC_TMDB_API_KEY=sua_chave_tmdb_aqui

# OPCIONAL - Banco de dados (sem isso, usa memória)
POSTGRES_URL=sua_connection_string_postgres

# OPCIONAL - Segredo para JWT (tem valor padrão para dev)
JWT_SECRET=seu_segredo_super_secreto
```

### Rodando Localmente

```bash
# Modo desenvolvimento (com hot-reload)
npm run dev

# Acesse: http://localhost:3000
```

### Build de Produção

```bash
# Gerar build otimizado
npm run build

# Iniciar servidor de produção
npm run start
```

---

## 📁 Estrutura do Projeto

```
superflix/
├── 📂 public/              # Assets estáticos (imagens, ícones)
├── 📂 src/
│   ├── 📂 app/
│   │   ├── 📂 (auth)/      # Login, Registro
│   │   ├── 📂 (main)/      # Home, Filmes, Séries, TV, etc
│   │   └── 📂 api/         # Rotas da API REST
│   │       ├── 📂 auth/    # Autenticação
│   │       ├── 📂 proxy/   # Sistema de proxy (embed, hls, asset)
│   │       └── 📂 tv/      # Canais de TV
│   ├── 📂 components/      # Componentes React reutilizáveis
│   ├── 📂 context/         # Providers (Auth, Theme, Toast)
│   ├── 📂 lib/             # Utilitários e configurações
│   ├── 📂 services/        # Integrações (TMDB, EmbedTV)
│   └── 📂 types/           # Definições TypeScript
├── 📄 .env.local           # Variáveis de ambiente (criar)
├── 📄 CLAUDE.md            # Instruções para IA
├── 📄 next.config.ts       # Configuração Next.js
├── 📄 tailwind.config.ts   # Configuração Tailwind
└── 📄 package.json         # Dependências
```

---

## 🤝 Contribuindo

Contribuições são **muito bem-vindas**! O Superflix é um projeto da comunidade, para a comunidade.

### Como Contribuir

1. **Fork o repositório**
   ```bash
   # Clique em "Fork" no GitHub ou use:
   gh repo fork TheusN/superflix
   ```

2. **Clone seu fork**
   ```bash
   git clone https://github.com/SEU_USUARIO/superflix.git
   cd superflix
   ```

3. **Crie uma branch para sua feature**
   ```bash
   git checkout -b feature/minha-feature-incrivel
   ```

4. **Faça suas alterações**
   ```bash
   # Desenvolva sua feature...
   npm run dev  # Teste localmente
   npm run lint # Verifique erros
   ```

5. **Commit suas mudanças**
   ```bash
   git add .
   git commit -m "feat: adiciona minha feature incrível"
   ```

6. **Push para seu fork**
   ```bash
   git push origin feature/minha-feature-incrivel
   ```

7. **Abra um Pull Request**
   - Vá para o repositório original
   - Clique em "New Pull Request"
   - Selecione sua branch
   - Descreva suas mudanças

### Padrões de Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

| Tipo | Descrição |
|------|-----------|
| `feat:` | Nova feature |
| `fix:` | Correção de bug |
| `docs:` | Documentação |
| `style:` | Formatação (sem mudança de código) |
| `refactor:` | Refatoração |
| `test:` | Testes |
| `chore:` | Tarefas de manutenção |

### Ideias para Contribuir

- 🐛 **Encontrou um bug?** Abra uma [issue](https://github.com/TheusN/superflix/issues)
- 💡 **Tem uma ideia?** Proponha uma [feature](https://github.com/TheusN/superflix/issues/new)
- 📝 **Melhorar docs?** PRs são bem-vindos!
- 🌍 **Tradução?** Ajude a internacionalizar!
- 🎨 **Designer?** Proponha melhorias de UI/UX!

---

## 🏗️ Arquitetura

### Stack Principal

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Next.js | 16 | Framework React com App Router |
| React | 19 | Biblioteca de UI |
| TypeScript | 5 | Tipagem estática |
| Tailwind CSS | 4 | Estilização |
| Vercel Postgres | - | Banco de dados |

### APIs Utilizadas

| API | Descrição |
|-----|-----------|
| **TMDB** | Metadados de filmes/séries (posters, sinopses, etc) |
| **SuperflixAPI** | Reprodução de conteúdo via embed |
| **EmbedTV** | Canais de TV ao vivo |

### Sistema de Proxy

O Superflix utiliza um sistema inteligente de proxy para contornar restrições:

```
Cliente → Next.js API → DNS over HTTPS (Cloudflare) → Conteúdo
```

- **Cloudflare DoH** - Resolução DNS segura
- **Interceptors JS** - Reescrita de URLs em tempo real
- **HLS Proxy** - Streaming adaptativo

---

## 🚀 Deploy

### Vercel (Recomendado)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/TheusN/superflix)

1. Clique no botão acima
2. Configure as variáveis de ambiente
3. Deploy!

### Variáveis na Vercel

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `NEXT_PUBLIC_TMDB_API_KEY` | ✅ | Chave da API TMDB |
| `POSTGRES_URL` | ❌ | Connection string Postgres |
| `JWT_SECRET` | ❌ | Segredo para tokens |

### Outras Plataformas

O Superflix funciona em qualquer plataforma que suporte Next.js:
- Railway
- Render
- DigitalOcean
- AWS Amplify
- Docker

---

## 📜 Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run start    # Iniciar produção
npm run lint     # Verificar código
```

---

## 🙏 Agradecimentos

- [TMDB](https://www.themoviedb.org/) - Pela incrível API de metadados
- [Next.js](https://nextjs.org/) - Framework extraordinário
- [Vercel](https://vercel.com/) - Hospedagem e infraestrutura
- **Comunidade Open Source** - Por todo o suporte

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 📬 Contato

**TheusNattan** - Criador do Superflix

- GitHub: [@TheusN](https://github.com/TheusN)

---

<p align="center">
  <strong>⭐ Se você gostou do projeto, deixe uma estrela!</strong>
</p>

<p align="center">
  Feito com ❤️ por <a href="https://github.com/TheusN">TheusNattan</a> e <a href="https://github.com/TheusN/superflix/graphs/contributors">contribuidores</a>
</p>

<p align="center">
  <a href="https://superflix.omniwhats.com/">
    <img src="https://img.shields.io/badge/🎬_Acesse_o_Superflix-00d26a?style=for-the-badge" alt="Acesse o Superflix" />
  </a>
</p>
