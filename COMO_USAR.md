# 🎮 Campaign Hub - Guia de Uso

## ✅ Status da Aplicação

A aplicação está **FUNCIONANDO** e rodando nos seguintes endereços:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **PostgreSQL**: localhost:5432

## 🚀 Primeira Vez - Como Acessar

### 1. Abrir o Frontend

Abra seu navegador e acesse:
```
http://localhost
```

### 2. Criar sua Conta

1. Clique em "Registrar" ou "Sign Up"
2. Preencha:
   - **Nome**: Seu nome
   - **Email**: seu@email.com
   - **Senha**: mínimo 6 caracteres
3. Clique em "Criar Conta"

O primeiro usuário criado automaticamente será **Admin**.

### 3. Fazer Login

Após criar a conta, você será redirecionado para o login:
1. Digite **email** e **senha**
2. Clique em "Entrar"

## 📋 Funcionalidades Principais

### 🏰 Campanhas

**Criar Nova Campanha:**
1. No dashboard, clique em "Nova Campanha"
2. Preencha:
   - Nome da campanha
   - Sistema (D&D 5E, Pathfinder, etc.)
   - Descrição
3. Clique em "Criar"

**Gerenciar Campanhas:**
- Ver todas as campanhas
- Editar detalhes
- Adicionar/remover jogadores
- Exportar dados (CSV)

### ⚔️ Personagens

**Criar Personagem:**
1. Entre em uma campanha
2. Clique em "Novo Personagem"
3. Preencha:
   - Nome
   - Raça
   - Classe
   - Atributos (Força, Destreza, etc.)
4. O sistema calcula XP automaticamente

**Gerenciar Personagem:**
- Atualizar atributos
- Ganhar XP (level up automático)
- Adicionar itens
- Ver histórico

### 📖 Sessões

**Criar Sessão:**
1. Entre na campanha
2. Clique em "Nova Sessão"
3. Preencha:
   - Título
   - Data
   - Duração
   - Resumo do que aconteceu
4. Adicione XP ganho pelos personagens

**Recursos:**
- Gerar PDF da sessão
- Ver histórico completo
- Estatísticas de sessões

### 💎 Loot (Itens/Tesouro)

**Adicionar Loot:**
1. Durante ou após uma sessão
2. Clique em "Adicionar Loot"
3. Preencha:
   - Nome do item
   - Tipo (arma, armadura, poção, etc.)
   - Valor
   - Descrição
4. Distribua para personagens

### 📊 Dashboard

O dashboard mostra:
- **Total de campanhas** ativas
- **Total de personagens** criados
- **Sessões realizadas** este mês
- **Distribuição por sistema** (barras)
- **Atividade mensal** (gráfico)

### 🔔 Notificações

- Novos eventos na campanha
- Convites para campanhas
- Level ups de personagens
- Marcar como lida

### 📚 Wiki Hierárquica + Legado 2023

**Importar conteudo canonico do legado:**
1. Entre em uma campanha como GM
2. Acesse a aba Wiki da campanha
3. Clique em **Importar legado 2023**
4. O sistema cria automaticamente paginas base para:
    - Legado 2023
    - Augustus Frostborne
    - Satoru Naitokira
    - Rolador Arcano 4d6
    - Galeria de Artes RPG

**Organizar em arvore (estilo caderno):**
- Crie paginas com pai/filho (subpaginas)
- Reordene a estrutura escolhendo a pagina pai no editor
- Use a arvore lateral para navegar no lore da campanha

**Links internos e backlinks:**
- No editor, use `@Nome da Pagina` para criar referencias internas
- Ao abrir uma pagina, veja:
   - Paginas citadas por ela
   - Backlinks (quem cita essa pagina)

### 🗺️ Mesa Online (VTT Beta)

**Abrir e sincronizar a mesa:**
1. Entre em uma campanha
2. Clique em **Mesa Online (VTT Beta)** no topo da tela
3. A rota principal da mesa e `/campaigns/:id/tabletop`
4. Em duas abas diferentes, abra a mesma campanha para validar sincronizacao em tempo real

**Recursos atuais:**
- Definicao de imagem de mapa por URL
- Grade configuravel (24 a 120 px)
- Criacao, remocao e edicao de tokens
- Drag and drop de tokens no palco da mesa
- Propagacao em tempo real para membros conectados na campanha

## 🎯 Cenários de Uso

### Scenario 1: Novo Mestre de Jogo

1. Registre-se no sistema
2. Crie sua primeira campanha "Mina de Phandelver"
3. Convide jogadores (adicione por email)
4. Cada jogador cria seu personagem
5. Organize a primeira sessão
6. Após o jogo, registre a sessão com resumo e XP
7. Distribua loot encontrado
8. Gere PDF da sessão para compartilhar

### Scenario 2: Jogador Entrando em Campanha

1. Registre-se no sistema
2. Receba convite do GM
3. Aceite o convite
4. Crie seu personagem
5. Veja o resumo das sessões anteriores
6. Acompanhe seu progresso de XP
7. Receba notificações de novos eventos

### Scenario 3: GM Organizando Múltiplas Campanhas

1. Dashboard mostra todas as campanhas
2. Alterne entre campanhas facilmente
3. Veja estatísticas de cada uma
4. Exporte dados para análise
5. Gerencie permissões de jogadores
6. Archive campanhas finalizadas

## 🛠️ Comandos Úteis

### Parar a Aplicação
```bash
cd c:\Users\augusto\Desktop\projeto_rpg_fullstack\campaign-hub
docker-compose down
```

### Iniciar a Aplicação
```bash
cd c:\Users\augusto\Desktop\projeto_rpg_fullstack\campaign-hub
docker-compose up -d
```

### Ver Logs
```bash
# Todos os serviços
docker-compose logs

# Apenas backend
docker-compose logs backend

# Apenas frontend
docker-compose logs frontend

# Com follow (tempo real)
docker-compose logs -f backend
```

### Backup do Banco de Dados
```bash
docker-compose exec postgres pg_dump -U campaign_user campaign_hub > backup.sql
```

### Restaurar Banco de Dados
```bash
docker-compose exec -T postgres psql -U campaign_user campaign_hub < backup.sql
```

### Limpar Cache e Rebuild
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## 🔐 Permissões e Roles

### Admin
- Criar/editar/deletar qualquer campanha
- Gerenciar todos os usuários
- Acesso completo ao sistema

### Game Master (GM)
- Criar campanhas
- Gerenciar suas campanhas
- Adicionar/remover jogadores
- Criar sessões
- Distribuir loot e XP

### Player (Jogador)
- Ver campanhas que participa
- Criar/editar seus personagens
- Ver sessões
- Ver loot recebido
- Receber notificações

## 📚 API Endpoints

### Autenticação
```
POST /api/auth/register    - Registrar usuário
POST /api/auth/login       - Login
POST /api/auth/logout      - Logout
POST /api/auth/refresh     - Renovar token
GET  /api/auth/profile     - Ver perfil
```

### Campanhas
```
GET    /api/campaigns              - Listar campanhas
POST   /api/campaigns              - Criar campanha
GET    /api/campaigns/:id          - Ver campanha
PUT    /api/campaigns/:id          - Atualizar campanha
DELETE /api/campaigns/:id          - Deletar campanha
POST   /api/campaigns/:id/members  - Adicionar membro
DELETE /api/campaigns/:id/members/:memberId - Remover membro
GET    /api/campaigns/:id/export   - Exportar CSV
```

### Personagens
```
GET    /api/characters                - Listar personagens
POST   /api/characters                - Criar personagem
GET    /api/characters/:id            - Ver personagem
PUT    /api/characters/:id            - Atualizar personagem
DELETE /api/characters/:id            - Deletar personagem
POST   /api/characters/:id/xp         - Adicionar XP
```

### Sessões
```
GET    /api/sessions                       - Listar sessões
POST   /api/sessions                       - Criar sessão
GET    /api/sessions/:id                   - Ver sessão
PUT    /api/sessions/:id                   - Atualizar sessão
DELETE /api/sessions/:id                   - Deletar sessão
GET    /api/sessions/:sessionId/report.pdf - Baixar PDF
```

### Dashboard
```
GET /api/dashboard/stats - Estatísticas gerais
```

### Wiki
```
GET  /api/wiki/campaign/:campaignId             - Listar paginas wiki
GET  /api/wiki/campaign/:campaignId/tree        - Arvore hierarquica da wiki
POST /api/wiki/campaign/:campaignId/seed-legacy - Importar legado 2023 (GM)
GET  /api/wiki/:wikiPageId                      - Ver pagina wiki
POST /api/wiki                                  - Criar pagina wiki
PUT  /api/wiki/:wikiPageId                      - Atualizar pagina wiki
DELETE /api/wiki/:wikiPageId                    - Remover pagina wiki
```

### Notificações
```
GET   /api/notifications      - Listar notificações
GET   /api/notifications/:id  - Ver notificação
PATCH /api/notifications/:id  - Marcar como lida
```

### Realtime (Socket.IO) - Mesa Online
```
campaign:tabletop:request  - Solicita estado atual da mesa da campanha
campaign:tabletop:update   - Atualiza mapa, grade e tokens da mesa
campaign:tabletop:state    - Broadcast do estado consolidado da mesa
```

## 🐛 Troubleshooting

### Frontend não carrega
1. Verifique se o container está rodando: `docker-compose ps`
2. Verifique logs: `docker-compose logs frontend`
3. Tente acessar: http://localhost
4. Limpe cache do navegador (Ctrl+Shift+Del)

### API não responde
1. Verifique health check: http://localhost:3000/health
2. Verifique logs: `docker-compose logs backend`
3. Verifique se o banco está rodando: `docker-compose ps postgres`

### Banco de dados com erro
1. Verifique conexão: `docker-compose logs postgres`
2. Recrie o banco:
   ```bash
   docker-compose down -v
   docker-compose up -d
   docker-compose exec backend npx prisma migrate deploy
   ```

### CORS Error
- O backend já está configurado para aceitar `http://localhost`
- Se estiver em outra porta, ajuste `CORS_ORIGIN` no `.env`

## 📞 Suporte

Caso encontre problemas:

1. Verifique os logs: `docker-compose logs`
2. Consulte `TROUBLESHOOTING.md`
3. Verifique se as portas 80, 3000 e 5432 estão livres
4. Reinicie os containers: `docker-compose restart`

## 🎉 Pronto para Jogar!

Sua aplicação está **100% funcional** e pronta para ser usada! 🚀

- ✅ Backend rodando
- ✅ Frontend rodando
- ✅ Banco de dados configurado
- ✅ Migrações aplicadas
- ✅ Sistema de autenticação ativo
- ✅ Todas as features funcionando

**Bom jogo! 🎲**
