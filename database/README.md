# Configuracao do Banco de Dados - Superflix

Este guia explica como configurar o banco de dados PostgreSQL para o Superflix.

## Pre-requisitos

- Node.js 18+
- Servidor PostgreSQL (local ou remoto)

## Configuracao Rapida

### 1. Obter String de Conexao

Voce precisa de uma URL de conexao PostgreSQL no formato:

```
postgres://usuario:senha@host:porta/banco?sslmode=disable
```

Exemplos:
- Local: `postgres://postgres:senha@localhost:5432/superflix`
- Remoto: `postgres://user:pass@servidor.com:5432/superflix_db?sslmode=disable`

### 2. Configurar Variaveis de Ambiente

Crie ou edite o arquivo `.env.local` na raiz do projeto:

```env
# =============================================
# POSTGRESQL - Conexao Direta
# =============================================
POSTGRES_URL="postgres://usuario:senha@host:porta/banco?sslmode=disable"

# =============================================
# JWT - Autenticacao
# =============================================
JWT_SECRET="sua-chave-secreta-jwt-aqui"

# =============================================
# TMDB API
# =============================================
NEXT_PUBLIC_TMDB_API_KEY="sua-chave-tmdb"

# =============================================
# Base URL (Opcional)
# =============================================
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### 3. Criar Tabelas

Execute o script de setup:

```bash
npm run db:setup
```

Este script cria todas as tabelas e um usuario admin padrao.

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

## Deploy

### Variaveis de Ambiente

Adicione as variaveis abaixo no seu ambiente de producao:

| Variavel | Obrigatorio | Descricao |
|----------|-------------|-----------|
| `POSTGRES_URL` | Sim | String de conexao PostgreSQL |
| `JWT_SECRET` | Sim | Chave secreta para tokens JWT |
| `NEXT_PUBLIC_TMDB_API_KEY` | Sim | Chave da API TMDB |
| `NEXT_PUBLIC_BASE_URL` | Nao | URL base da aplicacao |

## Problemas Comuns

### Erro: "Database offline"

Verifique se a variavel `POSTGRES_URL` esta configurada corretamente no `.env.local`.

### Erro: "relation does not exist"

As tabelas nao foram criadas. Execute `npm run db:setup` ou o SQL em `database/schema.sql`.

### Erro de conexao SSL

Se seu servidor nao usa SSL, adicione `?sslmode=disable` no final da URL de conexao.

### Erro: "password authentication failed"

Verifique se o usuario e senha na URL de conexao estao corretos.

## Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `database/setup.js` | Script para criar tabelas |
| `database/schema.sql` | Schema SQL completo |
| `database/README.md` | Este arquivo |
| `src/lib/db.ts` | Cliente de banco usando pg |

## Seguranca

- Nunca compartilhe sua `POSTGRES_URL` ou `JWT_SECRET`
- Nunca exponha variaveis sem `NEXT_PUBLIC_` no cliente
- Altere a senha do admin padrao em producao
- Use HTTPS em producao
- O `.env.local` esta no `.gitignore`
