# R.BEK Intelligence Platform — V1

Aplicação web real para inteligência comercial de engenharia, publicada em `crm.rbek.eng.br`.

## Entregue nesta V1
- autenticação por token com Laravel Sanctum;
- dashboard executivo com indicadores reais do PostgreSQL;
- CRUD de empresas e oportunidades;
- pipeline Kanban com atualização de status por arrastar e soltar;
- consultas de contatos, atividades, obras, licitações e evidências;
- agenda comercial;
- importação inicial do Banco de Dados Mestre;
- frontend responsivo Next.js/TypeScript;
- API Laravel/PostgreSQL;
- Dockerfiles e configuração Railway.

## Primeiro acesso
- E-mail: `admin@rbek.eng.br`
- Senha inicial: `Rbek@2026`

**Altere a senha após o primeiro acesso.** Em produção, defina `ADMIN_INITIAL_PASSWORD` no backend antes do primeiro seed.

## Railway — serviços
Crie 3 serviços no mesmo projeto:
1. PostgreSQL (já criado)
2. Backend a partir do repositório, Root Directory `/backend`
3. Frontend a partir do repositório, Root Directory `/frontend`

### Backend — variáveis
- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://api.crm.rbek.eng.br`
- `FRONTEND_URL=https://crm.rbek.eng.br`
- `APP_KEY` (gere com `php artisan key:generate --show` ou use uma chave base64 válida)
- `ADMIN_INITIAL_PASSWORD` (senha temporária forte)

### Frontend — variável
- `NEXT_PUBLIC_API_URL=https://api.crm.rbek.eng.br/api`

### Domínios
- Frontend: `crm.rbek.eng.br`
- Backend: `api.crm.rbek.eng.br`

## Desenvolvimento local
```bash
cp .env.example .env
docker compose up --build
```
Frontend: `http://localhost:3000`  
Backend: `http://localhost:8000`
