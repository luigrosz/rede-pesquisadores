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
