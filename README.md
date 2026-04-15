Para rodar o projeto certifique-se de ter o docker instalado.

   ```
   docker compose up --build -d
   ```

Entre no projeto pelo link:

http://localhost


Como recuperar um backup:

```
docker compose down
```
```
docker compose up -d projeto-farmacia-db
```

espere um pouco para o db iniciar

cat ./backups/your-backup-file.sql.gz | gunzip | docker compose exec -T projeto-farmacia-db psql -U postgres -d ${POSTGRES_DB}

docker compose up -d


CRIAR PRIMEIRA CONTA (ADMIN):

Substitua SUA_SENHA por uma senha de sua escolha.

1. Criar o pesquisador via API:

```
curl -s -X POST http://localhost:3000/pesquisador \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Admin Master",
    "email": "admin@admin.com",
    "password": "SUA_SENHA",
    "celular": "00000000000",
    "link_lattes": "http://lattes.cnpq.br/0000000000000000",
    "localidade_data": { "nome_cidade": "Barra do Garcas", "nome_estado": "Mato Grosso" },
    "pagina_institucional": null,
    "pq": false,
    "is_admin": true,
    "editor_revista": false,
    "laboratorio": "Administração",
    "sbfte": false,
    "area_doutorado_data": null,
    "vinculos_data": [],
    "grupos_pesquisa_data": [],
    "areas_pesquisa": [],
    "disciplinas": [],
    "publicacoes": [],
    "redes_sociais": [],
    "revistas_editadas": [],
    "pos_graduacoes": [],
    "org_sociedades": [],
    "servicos": [],
    "equipamentos": []
  }'
```

2. Ativar a conta e marcar como master admin diretamente no banco:

```
docker compose exec projeto-farmacia-db psql -U postgres -d rede_pesquisadores -c "UPDATE pesquisador SET is_enabled = TRUE, is_master_admin = TRUE WHERE email = 'admin@admin.com';"
```
