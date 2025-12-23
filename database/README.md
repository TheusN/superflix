# Configuracao do Banco de Dados - Superflix

Este guia explica como configurar o banco de dados Supabase para o Superflix.

## Pre-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) (gratuito)

## Configuracao Rapida

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em **New Project**
3. Escolha um nome e senha para o banco
4. Aguarde o projeto ser criado (1-2 minutos)

### 2. Obter Credenciais

Apos criar o projeto, obtenha as credenciais:

#### API Keys (Settings > API)
- **Project URL** - `https://xxxxx.supabase.co`
- **anon/public key** - Chave publica para o cliente
- **service_role key** - Chave privada para o servidor (NUNCA exponha!)

#### Database (Settings > Database)
- **Connection string (URI)** - URL do PostgreSQL

### 3. Configurar Variaveis de Ambiente

Crie ou edite o arquivo `.env.local` na raiz do projeto:

```env
# =============================================
# SUPABASE - Configuracoes Principais
# =============================================
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_URL="https://seu-projeto.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_JWT_SECRET="seu-jwt-secret-do-supabase"

# =============================================
# POSTGRES - Conexao Direta (para scripts)
# =============================================
POSTGRES_URL="postgres://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# =============================================
# JWT - Autenticacao
# =============================================
JWT_SECRET="use-o-mesmo-jwt-secret-do-supabase"

# =============================================
# TMDB API
# =============================================
NEXT_PUBLIC_TMDB_API_KEY="sua-chave-tmdb"
```

### 4. Criar Tabelas no Supabase

#### Opcao A: Via SQL Editor (Recomendado)

1. Acesse o dashboard do Supabase
2. Va em **SQL Editor**
3. Cole o conteudo de `database/schema.sql`
4. Clique em **Run**

#### Opcao B: Via Script Node.js

```bash
npm run db:setup
```

Este script usa conexao direta com PostgreSQL para criar as tabelas.

## Usuario Admin Padrao

Apos o setup, um usuario administrador e criado:

| Campo | Valor |
|-------|-------|
| Email | `admin@admin.com` |
| Senha | `123456` |
| Permissao | Admin Master |

> **IMPORTANTE:** Altere a senha do admin apos o primeiro login em producao!

## Estrutura das Tabelas

### users
Armazena informacoes dos usuarios.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### watch_history
Historico de visualizacao dos usuarios.

```sql
CREATE TABLE watch_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tmdb_id INTEGER NOT NULL,
    imdb_id VARCHAR(20),
    title VARCHAR(255) NOT NULL,
    poster_path VARCHAR(255),
    media_type VARCHAR(20) NOT NULL,
    season INTEGER,
    episode INTEGER,
    progress REAL DEFAULT 0,
    watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tmdb_id, season, episode)
);
```

### favorites
Conteudos favoritos dos usuarios.

```sql
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tmdb_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    poster_path VARCHAR(255),
    media_type VARCHAR(20) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tmdb_id)
);
```

### system_settings
Configuracoes do sistema.

```sql
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);
```

### admin_logs
Logs de acoes administrativas.

```sql
CREATE TABLE admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Deploy na Vercel

### 1. Conectar Repositorio

1. Acesse [vercel.com](https://vercel.com)
2. Importe seu repositorio do GitHub
3. Configure as variaveis de ambiente

### 2. Variaveis de Ambiente na Vercel

Adicione TODAS as variaveis abaixo em **Settings > Environment Variables**:

| Variavel | Obrigatorio | Descricao |
|----------|-------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave publica do Supabase |
| `SUPABASE_URL` | Sim | URL do projeto Supabase (servidor) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Chave de servico do Supabase |
| `SUPABASE_JWT_SECRET` | Sim | Segredo JWT do Supabase |
| `JWT_SECRET` | Sim | Mesmo valor do SUPABASE_JWT_SECRET |
| `POSTGRES_URL` | Opcional | URL PostgreSQL (para scripts) |
| `NEXT_PUBLIC_TMDB_API_KEY` | Sim | Chave da API TMDB |

### 3. Deploy

Apos configurar as variaveis, faca o deploy:

```bash
git push origin main
```

A Vercel fara o build e deploy automaticamente.

## Problemas Comuns

### Erro: "Database offline"

Verifique se as variaveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estao configuradas corretamente.

### Erro: "relation does not exist"

As tabelas nao foram criadas. Execute o SQL em `database/schema.sql` no SQL Editor do Supabase.

### Erro: "permission denied"

Verifique se esta usando a `SUPABASE_SERVICE_ROLE_KEY` (nao a `anon key`) para operacoes do servidor.

### Erro de conexao no script setup.js

O script `database/setup.js` usa conexao direta com PostgreSQL. Certifique-se de que:
1. `POSTGRES_URL` esta configurada
2. O IP do seu computador esta liberado no Supabase (ou use a URL com pooler)

## Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `database/setup.js` | Script para criar tabelas via PostgreSQL |
| `database/schema.sql` | Schema SQL completo |
| `database/README.md` | Este arquivo |
| `src/lib/db.ts` | Cliente de banco usando Supabase JS SDK |

## Seguranca

- Nunca compartilhe `SUPABASE_SERVICE_ROLE_KEY`
- Nunca exponha variaveis sem `NEXT_PUBLIC_` no cliente
- Altere a senha do admin padrao em producao
- Use HTTPS em producao
- O `.env.local` esta no `.gitignore`

## Arquitetura

O Superflix usa duas formas de acessar o banco:

1. **Supabase JS SDK** (`@supabase/supabase-js`)
   - Usado pelas API routes do Next.js
   - Funciona via HTTP/REST
   - Compativel com Turbopack/Edge

2. **PostgreSQL Direto** (`pg`)
   - Usado pelo script `database/setup.js`
   - Conexao TCP direta
   - Para operacoes de setup/migracao
