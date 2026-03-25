<p align="center">
  <img src="https://img.shields.io/badge/⚔️_Campaign_Hub-RPG_Management-c9a84c?style=for-the-badge&labelColor=0f0f1a" alt="Campaign Hub" />
</p>

<h1 align="center">⚔️ Campaign Hub</h1>

<p align="center">
  <strong>A mega plataforma web para gerenciamento de campanhas de RPG</strong>
  <br />
  <em>De um sonho de faculdade a uma aplicação full-stack completa</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Angular-17-dd0031?style=flat-square&logo=angular" />
  <img src="https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js" />
  <img src="https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express" />
  <img src="https://img.shields.io/badge/Prisma-5-2d3748?style=flat-square&logo=prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169e1?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ed?style=flat-square&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white" />
</p>

---

## 📖 Sobre o Projeto

**Campaign Hub** é uma aplicação web full-stack para gerenciamento completo de campanhas de RPG de mesa. O projeto nasceu em **julho de 2023**, no 1º semestre do curso de Tecnologia em Sistemas Para Internet no **IFRN Campus Parnamirim**, como um simples site HTML/CSS com páginas de personagens e um rolador de dados em JavaScript.

Três anos depois, evoluiu para uma **plataforma completa e moderna** com autenticação, CRUD de campanhas, personagens, sessões, espólios, dashboard com estatísticas, wiki de sistemas de RPG, rolador de dados interativo e muito mais — tudo containerizado com Docker.

### 🕰️ Linha do Tempo

| Ano | Marco |
|-----|-------|
| **2023** | Primeiro protótipo — site HTML/CSS/JS puro com Bootstrap. Páginas de personagens (Augustus Frostborne, Satoru Naitokira), galeria de artes de RPG, rolador 4d6. |
| **2024** | Aprofundamento em programação web — aprendizado de frameworks, APIs REST, bancos de dados. |
| **2025** | Desenvolvimento da arquitetura full-stack — Angular 17, Node.js/Express, Prisma, PostgreSQL. |
| **2026** | Integração completa — fusão do projeto original com a plataforma moderna. Landing page, Wiki, Dice Roller, sistema de campanhas completo, Docker. |

---

## ✨ Funcionalidades

### 🏠 Área Pública (sem login)
- **Landing Page** — Apresentação do projeto com hero animado, showcase de features, timeline de evolução e galeria de personagens icônicos
- **Wiki de Sistemas** — Enciclopédia interativa de RPG com D&D 5e, Tormenta 20, Call of Cthulhu e Pathfinder (classes, raças, mecânicas)
- **Rolador de Dados** — Rolagem rápida (d4–d100), rolagem múltipla com estatísticas, gerador de atributos 4d6 drop lowest com modificadores e histórico

### 🔐 Área Autenticada
- **Autenticação** — Registro, login com JWT (access + refresh tokens), proteção de rotas
- **Dashboard** — Estatísticas do jogador, atividade recente, campanhas ativas
- **Campanhas (CRUD)** — Criar, editar, excluir campanhas com suporte a múltiplos sistemas (D&D 5e, Tormenta 20, Call of Cthulhu, Pathfinder)
- **Personagens (CRUD)** — Gerenciar personagens vinculados a campanhas, com atributos/recursos flexíveis por sistema
- **Sessões (CRUD)** — Registrar sessões de jogo com data, resumo, XP e log narrativo (público + notas GM)
- **Espólios (CRUD)** — Controlar itens e tesouros obtidos, com atribuição a personagens
- **Notificações** — Sistema de notificações em tempo real
- **Permissões** — Controle GM vs Player por campanha (somente GM cria sessões, espólios, etc.)
- **Engine Multi-Sistema** — Templates de regras para D&D 5e, PF2e, CoC 7e e Tormenta20
- **Wiki de Campanha** — Páginas markdown com categorias, tags e visibilidade pública/GM
- **Histórico Persistido de Rolagens** — Fórmulas com `kh/kl`, `advantage/disadvantage` e modificador por atributo
- **Sanidade e Mana** — Fluxos específicos para CoC (sanity check) e Tormenta20 (spell cast + fé)

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                         DOCKER                              │
│                                                             │
│  ┌─────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │   Frontend   │  │     Backend      │  │  PostgreSQL   │  │
│  │  Angular 17  │──│  Node.js/Express │──│    15-alpine  │  │
│  │   Nginx:80   │  │   TypeScript     │  │    Port 5432  │  │
│  │              │  │   Prisma ORM     │  │               │  │
│  │  Port 80     │  │   Port 3000      │  │               │  │
│  └─────────────┘  └──────────────────┘  └───────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Frontend** | Angular (standalone components) | 17 |
| **Estilização** | SCSS + CSS Custom Properties | — |
| **Backend** | Node.js + Express | 20 / 4 |
| **Linguagem** | TypeScript | 5 |
| **ORM** | Prisma | 5.22 |
| **Banco de Dados** | PostgreSQL | 15 |
| **Autenticação** | JWT (jsonwebtoken + bcryptjs) | — |
| **Containerização** | Docker + Docker Compose | — |
| **Servidor Web** | Nginx (produção) | alpine |
| **Testes** | Jest | — |

---

## 📂 Estrutura do Projeto

```
campaign-hub/
│
├── docker-compose.yml            # Orquestração dos 3 containers
│
├── backend/
│   ├── Dockerfile                # Build multi-stage Node.js
│   ├── prisma/
│   │   └── schema.prisma         # Modelos do banco (fase multi-sistema)
│   └── src/
│       ├── server.ts             # Entry point Express
│       ├── config/               # Database + Upload configs
│       ├── middlewares/          # Auth, Error handler, Permissions
│       ├── modules/
│       │   ├── auth/             # Register, Login, Refresh Token
│       │   ├── campaigns/        # CRUD completo de campanhas
│       │   ├── characters/       # CRUD de personagens
│       │   ├── sessions/         # CRUD de sessões
│       │   ├── loot/             # CRUD de espólios
│       │   ├── dashboard/        # Stats e atividade
│       │   ├── notifications/    # Sistema de notificações
│       │   ├── rpg-systems/      # Catálogo de sistemas de RPG
│       │   ├── dice/             # Rolagens persistidas
│       │   └── wiki/             # Wiki da campanha
│       └── utils/                # Error handler, XP calculator
│
└── frontend/
    ├── Dockerfile                # Build Angular + Nginx
    ├── nginx.conf                # Proxy reverso para API
    └── src/
        ├── styles.scss           # Tema RPG dark fantasy global
        └── app/
            ├── app.routes.ts     # Rotas públicas + protegidas
            ├── core/
            │   ├── guards/       # Auth guard
            │   ├── interceptors/ # JWT interceptor
            │   └── services/     # 7 services (auth, campaign, etc.)
            └── features/
                ├── home/         # Landing page pública
                ├── wiki/         # Wiki de sistemas de RPG
                ├── dice/         # Rolador de dados interativo
                ├── auth/         # Login + Registro
                ├── dashboard/    # Dashboard com stats
                └── campaign/     # Lista + Detalhe (chars, sessions, loot)
```

---

## 🗄️ Modelo de Dados

```
Users ──────┬──── Campaigns ────┬──── Characters ────── Loot
            │                   │
            ├──── CampaignMembers    ├──── Sessions ──────── Loot
            │                   │
            ├──── Notifications │──── Events
            │
            ├──── ActivityLog
            │
            └──── RefreshTokens
```

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários com autenticação (name, email, password hash, role) |
| `refresh_tokens` | Tokens de refresh para renovação de sessão |
| `campaigns` | Campanhas de RPG (nome, descrição, sistema, dono) |
| `campaign_members` | Membros de campanhas com papel (GM / Player) |
| `characters` | Personagens (nome, classe, nível, XP, ficha) |
| `sessions` | Sessões de jogo (data, resumo, XP concedido) |
| `loot` | Espólios / itens (nome, descrição, valor, atribuído a personagem) |
| `rpg_systems` | Templates de regras por sistema (schema de atributos, flags de sanidade/mana etc.) |
| `items` | Catálogo de itens enriquecido (raridade, tipo, valor, propriedades) |
| `loot_items` | Relação N:N entre loot e itens |
| `wiki_pages` | Wiki markdown da campanha com categorias e tags |
| `dice_rolls` | Histórico persistido de rolagens |
| `sanity_events` | Eventos de sanidade por personagem (CoC) |
| `spell_casts` | Conjurações com custo de mana/fé (Tormenta20) |
| `events` | Eventos de campanha (Battle, Story, NPC, Treasure) |
| `notifications` | Notificações de usuário |
| `activity_logs` | Log de atividade do sistema |

---

## 🚀 Quick Start

### Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando
- Git

### 1. Clonar o repositório

```bash
git clone https://github.com/Augusto240/campaign-hub.git
cd campaign-hub
```

### 2. Configurar variáveis de ambiente

O arquivo `.env` do backend já vem pré-configurado para Docker. Para personalizar:

```bash
cp backend/.env.example backend/.env
# Edite as variáveis se necessário
```

### 3. Subir com Docker Compose

```bash
docker compose up -d
```

Isso irá:
- Subir o **PostgreSQL** na porta `5432`
- Aplicar as **migrations** do Prisma automaticamente
- Subir o **Backend** (Express) na porta `3000`
- Buildar o **Frontend** (Angular) e servir via Nginx na porta `80`

### 4. Acessar

| Serviço | URL |
|---------|-----|
| **Aplicação** | [http://localhost](http://localhost) |
| **API** | [http://localhost:3000/api](http://localhost:3000/api) |
| **Health Check** | [http://localhost:3000/health](http://localhost:3000/health) |

---

## 🔧 Desenvolvimento Local (sem Docker)

### Backend

```bash
cd backend
npm install

# Configurar PostgreSQL local no .env
# DATABASE_URL="postgresql://campaign_user:campaign_pass@localhost:5432/campaign_hub"

npx prisma migrate dev --name init   # Criar/aplicar migrations locais
npm run dev                # Inicia com nodemon na porta 3000
```

### Frontend

```bash
cd frontend
npm install
ng serve                   # Inicia na porta 4200
```

---

## 📡 Endpoints da API

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/auth/register` | Registrar novo usuário |
| `POST` | `/api/auth/login` | Login (access + refresh token) |
| `POST` | `/api/auth/refresh` | Rotacionar refresh token e renovar sessão |
| `POST` | `/api/auth/logout` | Revogar refresh token |
| `GET` | `/api/auth/profile` | Perfil do usuário autenticado |

### Campanhas
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/campaigns` | Listar campanhas do usuário |
| `POST` | `/api/campaigns` | Criar campanha |
| `GET` | `/api/campaigns/:campaignId` | Detalhes da campanha |
| `PUT` | `/api/campaigns/:campaignId` | Atualizar campanha (owner/GM) |
| `DELETE` | `/api/campaigns/:campaignId` | Deletar campanha (owner) |
| `POST` | `/api/campaigns/:campaignId/members` | Adicionar membro |
| `DELETE` | `/api/campaigns/:campaignId/members/:userId` | Remover membro |
| `GET` | `/api/campaigns/:campaignId/stats` | Estatísticas da campanha |
| `GET` | `/api/campaigns/:campaignId/export` | Exportar campanha em CSV |

### Personagens
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/characters` | Criar personagem |
| `GET` | `/api/characters/campaign/:campaignId` | Listar personagens da campanha |
| `GET` | `/api/characters/:characterId` | Detalhes do personagem |
| `PUT` | `/api/characters/:characterId` | Atualizar personagem (owner/GM) |
| `DELETE` | `/api/characters/:characterId` | Deletar personagem (owner/GM) |
| `POST` | `/api/characters/:characterId/sheet` | Upload de ficha |
| `PATCH` | `/api/characters/:characterId/resources` | Atualizar recursos (hp/mana/sanity etc.) |
| `POST` | `/api/characters/:characterId/sanity-check` | Executar sanity check (sistemas com sanidade) |
| `GET` | `/api/characters/:characterId/sanity-events` | Histórico de eventos de sanidade |
| `POST` | `/api/characters/:characterId/spell-cast` | Registrar conjuração (sistemas com mana) |
| `GET` | `/api/characters/:characterId/spell-casts` | Histórico de conjurações |

### Sessões
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/sessions` | Criar sessão (GM) |
| `GET` | `/api/sessions/campaign/:campaignId` | Listar sessões da campanha |
| `GET` | `/api/sessions/:sessionId` | Detalhes da sessão |
| `PUT` | `/api/sessions/:sessionId` | Atualizar sessão (GM) |
| `PATCH` | `/api/sessions/:sessionId/log` | Atualizar log narrativo da sessão (GM) |
| `DELETE` | `/api/sessions/:sessionId` | Deletar sessão (GM) |
| `GET` | `/api/sessions/:sessionId/report` | Gerar relatório PDF |

### Loot
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/loot` | Criar loot (GM) |
| `GET` | `/api/loot/session/:sessionId` | Listar loot da sessão |
| `PUT` | `/api/loot/:lootId` | Atualizar loot (GM) |
| `DELETE` | `/api/loot/:lootId` | Deletar loot (GM) |
| `POST` | `/api/loot/:lootId/assign` | Atribuir loot a personagem (GM) |

### Dashboard e Notificações
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/dashboard/stats` | Estatísticas do usuário |
| `GET` | `/api/notifications` | Listar notificações do usuário |
| `PUT` | `/api/notifications/:notificationId/read` | Marcar notificação como lida |
| `PUT` | `/api/notifications/read-all` | Marcar todas como lidas |

### RPG Systems, Dice e Wiki
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/rpg-systems` | Listar sistemas suportados |
| `POST` | `/api/dice/roll` | Executar rolagem persistida |
| `GET` | `/api/dice/campaign/:campaignId` | Histórico de rolagens por campanha |
| `GET` | `/api/wiki/campaign/:campaignId` | Listar páginas da wiki |
| `GET` | `/api/wiki/:wikiPageId` | Obter página da wiki |
| `POST` | `/api/wiki` | Criar página da wiki |
| `PUT` | `/api/wiki/:wikiPageId` | Atualizar página da wiki |
| `DELETE` | `/api/wiki/:wikiPageId` | Remover página da wiki |

---

## 🎨 Design System

O projeto usa um **tema dark fantasy RPG** com CSS Custom Properties:

| Variável | Valor | Uso |
|----------|-------|-----|
| `--bg-primary` | `#0f0f1a` | Fundo principal |
| `--bg-secondary` | `#1a1a2e` | Cards, navbar |
| `--accent-primary` | `#c9a84c` | Dourado — destaque principal |
| `--accent-secondary` | `#b8860b` | Dourado escuro |
| `--font-display` | `Cinzel` | Títulos (serif medieval) |
| `--font-body` | `Inter` | Texto corrido (sans-serif) |
| `--font-fantasy` | `MedievalSharp` | Elementos especiais |

### Temas por Sistema de RPG

| Sistema | Cor | CSS Selector |
|---------|-----|-------------|
| D&D 5e | 🟡 Dourado `#c9a84c` | `[data-system="DND5E"]` |
| Tormenta 20 | 🔴 Carmesim `#dc2626` | `[data-system="T20"]` |
| Call of Cthulhu | 🟢 Verde `#059669` | `[data-system="COC"]` |
| Pathfinder | 🔵 Azul `#2563eb` | `[data-system="PATHFINDER"]` |

---

## 🧪 Testes

```bash
cd backend
npm test                   # Roda testes unitários com Jest
```

Testes incluem:
- `error-handler.test.ts` — Testes do utilitário de tratamento de erros
- `xp-calculator.test.ts` — Testes do calculador de XP

---

## 🐳 Comandos Docker Úteis

```bash
# Subir tudo
docker compose up -d

# Ver logs em tempo real
docker compose logs -f

# Rebuild completo (sem cache)
docker compose build --no-cache

# Parar tudo
docker compose down

# Parar e limpar volumes (reset do banco)
docker compose down --volumes

# Acessar shell do backend
docker compose exec backend sh

# Acessar shell do banco
docker compose exec postgres psql -U campaign_user -d campaign_hub
```

---

## 📋 Variáveis de Ambiente

### Backend (`backend/.env`)

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://campaign_user:campaign_pass@postgres:5432/campaign_hub` |
| `JWT_SECRET` | Chave do access token (mínimo 32 caracteres) | **Obrigatória** |
| `JWT_REFRESH_SECRET` | Chave do refresh token (mínimo 32 caracteres) | **Obrigatória** |
| `JWT_EXPIRES_IN` | Expiração do access token | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Expiração do refresh token | `7d` |
| `PORT` | Porta do servidor | `3000` |
| `NODE_ENV` | Ambiente de execução | `production` |
| `CORS_ORIGIN` | Origem permitida no CORS | `http://localhost` |

### Docker Compose

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `POSTGRES_USER` | Usuário do PostgreSQL | `campaign_user` |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL | `campaign_pass` |
| `POSTGRES_DB` | Nome do banco | `campaign_hub` |

### Migrations

- Use `npx prisma migrate deploy` para ambientes novos.
- Ordem atual de migrations:
- `20260320110000_initial_schema`
- `20260320120000_security_hardening`
- `20260320143000_phase3_multisystem`

---

## 🤝 Contribuição

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 👨‍💻 Autor

**Augusto** — Estudante de Tecnologia em Sistemas Para Internet @ IFRN Campus Parnamirim

> *"Quando eu entrei na faculdade, eu tinha um sonho de fazer uma mega aplicação web de RPG. Três anos depois, aqui está."*

---

<p align="center">
  <strong>⚔️ Que os dados estejam a seu favor! 🎲</strong>
</p>
