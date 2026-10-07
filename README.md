# ConectaFarmaco

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

# PROXY HOPS

./backend/.env

O valor do proxy hop deve ser, ao menos, 1, ja que ele sempre ficaria atras de ao menos 1 proxy (nginx) 

## Como conferir se o valor está certo

Depois rode os dois comandos abaixo, trocando o endereço pelo do deploy:

```
curl -s https://SEU-DOMINIO/api/health
```

```
curl -s -H 'X-Forwarded-For: 9.9.9.9' https:
//SEU-DOMINIO/api/health
```

Interprete o campo ip das respostas:

| ip na requisição normal | ip na requisição com X-Forwarded-For forjado | conclusão |

| IP público do cliente | IP público do cliente | correto, o valor de TRUST_PROXY_HOPS está certo |
| IP do host ou da rede docker (10.x, 172.x) | o mesmo IP | valor baixo demais, aumente
| IP público do cliente | 9.9.9.9 | valor alto demais, o cabeçalho está sendo falsificável, diminua |

## Exemplo (errado com 2 hops, certo com apenas 1): 

#### Errado:

curl -s https://conectafarmaco.lgrz.xyz/api/health
{"status":"ok","ip":"191.5.105.156","xff":"191.5.105.156","socket":"::ffff:172.29.0.1"}% 
curl -s -H 'X-Forwarded-For: 9.9.9.9' https://conectafarmaco.lgrz.xyz/api/health
{"status":"ok","ip":"9.9.9.9","xff":"9.9.9.9, 191.5.105.156","socket":"::ffff:172.29.0.1"}%  

#### Certo:
curl -s https://conectafarmaco.lgrz.xyz/api/health
{"status":"ok","ip":"191.5.105.156","xff":"191.5.105.156","socket":"::ffff:172.29.0.1"}%

curl -s -H 'X-Forwarded-For: 9.9.9.9' https://conectafarmaco.lgrz.xyz/api/health
{"status":"ok","ip":"191.5.105.156","xff":"9.9.9.9, 191.5.105.156","socket":"::ffff:172.29.0.1"}
