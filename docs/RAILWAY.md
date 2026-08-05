# Publicação no Railway

Plano inicial recomendado: Hobby.

## Serviços do projeto
1. PostgreSQL
2. Backend Laravel (pasta `/backend`)
3. Frontend Next.js (pasta `/frontend`)

## Domínios
- Frontend: `crm.rbek.eng.br`
- API: `api.crm.rbek.eng.br`

## Variáveis principais do backend
`APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://api.crm.rbek.eng.br`, `FRONTEND_URL=https://crm.rbek.eng.br` e as variáveis PostgreSQL fornecidas pelo Railway.

## Primeiro deploy
Execute no backend: `php artisan key:generate --show`, configure `APP_KEY`, depois `php artisan migrate --force --seed`.
