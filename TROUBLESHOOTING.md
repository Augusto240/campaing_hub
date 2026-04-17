# 🔧 Troubleshooting Guide - Campaign Hub

## Docker Build Issues

### 1. Build lento na primeira vez
**Sintoma**: Docker demora muito para construir
**Solução**: É normal na primeira vez. O Docker precisa:
- Baixar imagens base (Node, PostgreSQL)
- Instalar todas as dependências npm (573+ packages backend, 884+ frontend)
- Compilar TypeScript

**Tempo esperado**: 5-15 minutos na primeira build

### 2. npm ci falha (package-lock.json não encontrado)
**Sintoma**: `npm ci` retorna erro "lockfileVersion >= 1"
**Solução**: 
```bash
cd backend
npm install
cd ../frontend
npm install
```
Isso gera os `package-lock.json` necessários.

### 3. Port already in use
**Sintoma**: Erro dizendo que porta 3000, 5432 ou 80 já está em uso
**Solução**:
```bash
# Parar containers existentes
docker compose down

# Ou mudar as portas no docker-compose.yml
```

### 4. Database connection failed
**Sintoma**: Backend não conecta ao PostgreSQL
**Solução**:
```bash
# Verificar se o container postgres está rodando
docker ps

# Garantir segredos da API
cp backend/.env.example backend/.env

# Ver logs do postgres
docker compose logs postgres

# Recriar o banco
docker compose down -v
docker compose up --build
```
O `docker-compose.yml` jÃ¡ possui defaults locais seguros para Postgres, Grafana e `FRONTEND_URL`. O `.env` obrigatÃ³rio fica apenas em `backend/.env`.

---

## Desenvolvimento Local (Sem Docker)

### Backend

1. **Instalar PostgreSQL localmente**

2. **Configurar .env**
```bash
cd backend
cp .env.example .env
# Editar DATABASE_URL
```

3. **Instalar e rodar**
```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Acesse: http://localhost:4200

---

## Problemas Comuns de Runtime

### 1. CORS Error
**Sintoma**: Frontend recebe erro CORS
**Solução**: 
- Verificar `CORS_ORIGIN` no backend/.env
- Verificar `apiUrl` no frontend/src/environments/environment.ts

### 2. JWT Token inválido
**Sintoma**: 401 Unauthorized constantemente
**Solução**:
- Limpar localStorage do navegador
- Fazer logout e login novamente
- Verificar se JWT_SECRET está configurado

### 3. Migrations não aplicadas
**Sintoma**: Erros de tabela não encontrada
**Solução**:
```bash
# Desenvolvimento local
cd backend
npm run prisma:migrate

# Docker
docker compose exec backend npx prisma migrate deploy
```

---

## Performance Issues

### 1. Docker muito lento
**Solução**:
- Aumentar memória do Docker Desktop (Settings > Resources > Memory: 4GB+)
- Habilitar WSL 2 no Windows
- Usar modo desenvolvimento local em vez de Docker

### 2. Frontend lento para compilar
**Solução**:
```bash
# Usar build de produção
cd frontend
npm run build -- --configuration production

# Resultado em dist/campaign-hub
```

---

## Reset Completo

Se nada funcionar, reset completo:

```bash
# Parar tudo
docker compose down -v

# Limpar cache do Docker
docker system prune -a

# Remover node_modules
cd backend
rm -rf node_modules package-lock.json
cd ../frontend
rm -rf node_modules package-lock.json dist .angular

# Reinstalar tudo
cd ../backend
npm install
cd ../frontend
npm install

# Rebuild Docker
cd ..
docker compose up --build
```

---

## Logs Úteis

```bash
# Ver logs de todos os serviços
docker compose logs -f

# Apenas backend
docker compose logs -f backend

# Apenas frontend
docker compose logs -f frontend

# Apenas postgres
docker compose logs -f postgres
```

---

## Verificar Saúde dos Serviços

```bash
# Health check do backend
curl http://localhost:3002/health

# Verificar se Prisma está conectado
docker compose exec backend npx prisma db pull

# Acessar banco diretamente
docker compose exec postgres psql -U campaign_hub -d campaign_hub
```

---

## Comandos Úteis

```bash
# Recriar apenas um serviço
docker compose up --build backend

# Entrar no container
docker compose exec backend sh
docker compose exec frontend sh

# Ver volumes
docker volume ls

# Remover volume específico
docker volume rm campaign-hub_postgres_data

# Ver uso de espaço do Docker
docker system df
```

---

## Ambiente de Teste

Para rodar testes:

```bash
# Backend
cd backend
npm test

# Com coverage
npm run test:coverage

# Watch mode
npm run test:watch
```
Os testes do backend sobem um Postgres efÃªmero via Docker, entÃ£o nÃ£o dependem de banco local persistente.

---

## Contato e Suporte

Se o problema persistir:
1. Verifique os logs: `docker compose logs -f`
2. Crie um issue no GitHub com os logs
3. Inclua informações do sistema (Windows/Mac/Linux, versão Docker)

---

## Checklist de Verificação Rápida

- [ ] Docker Desktop está rodando?
- [ ] Portas 80, 3000, 5432 estão livres?
- [ ] `.env` existe no backend?
- [ ] `package-lock.json` existe em backend e frontend?
- [ ] RAM suficiente para Docker (mínimo 4GB)?
- [ ] Espaço em disco suficiente (mínimo 5GB)?

---

**Última atualização**: 15/02/2026
