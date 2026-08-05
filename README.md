# R.BEK Intelligence Platform — V1

Aplicação web própria da R.BEK para inteligência comercial em engenharia.

## Endereços planejados

- Aplicação: `https://crm.rbek.eng.br`
- API: `https://api.crm.rbek.eng.br`
- Hospedagem: Railway
- Banco: PostgreSQL Railway

## O que já está neste pacote

- Interface profissional e responsiva em Next.js/TypeScript.
- Login visual, dashboard executivo, empresas, oportunidades, pipeline Kanban, obras, evidências, licitações, agenda e configurações.
- Dados reais importados da planilha mestre: 21 empresas, 21 oportunidades, 21 obras e 21 evidências.
- API Laravel com endpoint de saúde, dashboard e CRUD de empresas.
- Banco PostgreSQL com migrations para empresas, oportunidades, obras, evidências, contatos, atividades e licitações.
- Seeder que importa automaticamente os dados atuais.
- Dockerfiles e configurações para Railway.

## Estrutura

- `frontend/`: Next.js.
- `backend/`: Laravel API.
- `branding/`: logotipos R.BEK.
- `docs/`: implantação.

## Publicação no GitHub

1. Descompacte este ZIP no computador.
2. No repositório `rbekdrive-eng/rbek-crm`, clique em **uploading an existing file**.
3. Arraste **todo o conteúdo de dentro da pasta `rbek-crm-v1`**, e não o ZIP.
4. Em **Commit changes**, escreva `feat: primeira versão da plataforma`.
5. Clique em **Commit changes**.

Para muitos arquivos, o GitHub Desktop é mais seguro. Instale-o, escolha **Add an Existing Repository from your Local Drive**, selecione a pasta descompactada, publique no repositório `rbek-crm` e faça o primeiro commit.

## Railway — serviços

Crie dois serviços a partir do mesmo repositório:

### Frontend
- Root Directory: `/frontend`
- Dockerfile: `Dockerfile`
- Variável: `NEXT_PUBLIC_API_URL=https://api.crm.rbek.eng.br/api`
- Domínio: `crm.rbek.eng.br`

### Backend
- Root Directory: `/backend`
- Dockerfile: `Dockerfile`
- Referencie o PostgreSQL pela variável `DATABASE_URL`.
- Variáveis mínimas: `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://api.crm.rbek.eng.br`, `FRONTEND_URL=https://crm.rbek.eng.br`.
- Domínio: `api.crm.rbek.eng.br`

## Observação de segurança

O login incluído no frontend demonstra a experiência visual. Antes de liberar usuários, conecte-o ao Laravel Sanctum e substitua a senha demonstrativa. Não publique credenciais no GitHub.
