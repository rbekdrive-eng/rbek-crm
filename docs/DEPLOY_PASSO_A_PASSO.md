# Publicação no Railway

1. No Railway, abra o projeto `RBEK-CRM`.
2. Clique em **New → GitHub Repo** e selecione `rbekdrive-eng/rbek-crm`.
3. Crie o serviço **Backend**. Em Settings, Root Directory = `/backend`; Dockerfile Path = `Dockerfile`.
4. Em Variables do Backend, adicione as variáveis descritas no README e referencie o `DATABASE_URL` do Postgres.
5. Gere um domínio temporário no Backend e teste `/up`.
6. Repita **New → GitHub Repo** para o serviço **Frontend**. Root Directory = `/frontend`; Dockerfile Path = `Dockerfile`.
7. Em Variables do Frontend, defina `NEXT_PUBLIC_API_URL` com o domínio do Backend seguido de `/api`.
8. Gere domínio temporário e teste o login.
9. Após validar, adicione os domínios personalizados `api.crm.rbek.eng.br` e `crm.rbek.eng.br`.
10. Na área DNS da Locaweb, crie os CNAME indicados pelo Railway. Não altere MX/e-mail.

Nunca envie senha, `APP_KEY` ou `DATABASE_URL` para o GitHub.
