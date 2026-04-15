CREATE TYPE tipo_vinculo AS ENUM ('primaria', 'secundario', 'pos');
CREATE TYPE metodo_pagamento AS ENUM ('pix', 'cartao_credito', 'boleto', 'transferencia_bancaria');
CREATE TYPE plataforma_social AS ENUM ('lattes', 'linkedin', 'researchgate', 'x', 'instagram');

CREATE TABLE "instituicao"(
    "id" SERIAL NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL
);

CREATE TABLE "localidade"(
    "id_localidade" SERIAL NOT NULL PRIMARY KEY,
    "nome_estado" TEXT NOT NULL,
    "nome_cidade" TEXT NOT NULL
);

CREATE TABLE "area_doutorado"(
    "id_doutorado" SERIAL NOT NULL PRIMARY KEY,
    "id_pesquisador" BIGINT NOT NULL,
    "titulo" TEXT NOT NULL,
    "instituicao_id" BIGINT NOT NULL,
    FOREIGN KEY("instituicao_id") REFERENCES "instituicao"("id")
);

CREATE TABLE "pesquisador"(
    "id_pesquisador" SERIAL NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "link_lattes" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "celular" VARCHAR(20) NOT NULL,
    "localidade" BIGINT NOT NULL,
    "pagina_institucional" TEXT NULL,
    "pq" BOOLEAN NOT NULL,
    "is_admin" BOOLEAN NOT NULL,
    "editor_revista" BOOLEAN NOT NULL,
    "laboratorio" TEXT NOT NULL,
    "area_doutorado" BIGINT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT FALSE,
    "sbfte" BOOLEAN DEFAULT FALSE,
    "enabled_until" DATE NULL,
    FOREIGN KEY("localidade") REFERENCES "localidade"("id_localidade"),
    FOREIGN KEY("area_doutorado") REFERENCES "area_doutorado"("id_doutorado")
);

CREATE TABLE "grupo_pesquisa"(
    "id_grupo" SERIAL NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "instituicao" BIGINT NOT NULL,
    "link" TEXT NOT NULL,
    FOREIGN KEY("instituicao") REFERENCES "instituicao"("id")
);

CREATE TABLE "revistas_editadas"(
    "id_revista" SERIAL NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "id_pesquisador" INTEGER NOT NULL,
    FOREIGN KEY("id_pesquisador") REFERENCES "pesquisador"("id_pesquisador")
);

CREATE TABLE "area_de_pesquisa"(
    "id_area_pesquisa" SERIAL NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "id_pesquisador" INTEGER NOT NULL,
    FOREIGN KEY("id_pesquisador") REFERENCES "pesquisador"("id_pesquisador")
);

CREATE TABLE "disciplinas"(
    "id_disciplina" SERIAL NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "id_pesquisador" INTEGER NOT NULL,
    FOREIGN KEY("id_pesquisador") REFERENCES "pesquisador"("id_pesquisador")
);

CREATE TABLE "servico"(
    "id_servico" SERIAL NOT NULL PRIMARY KEY,
    "id_pesquisador" BIGINT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "localidade" BIGINT NOT NULL,
    FOREIGN KEY("id_pesquisador") REFERENCES "pesquisador"("id_pesquisador"),
    FOREIGN KEY("localidade") REFERENCES "localidade"("id_localidade")
);

CREATE TABLE "vinculo"(
    "id_vinculo" SERIAL NOT NULL PRIMARY KEY,
    "id_pesquisador" BIGINT NOT NULL,
    "instituicao" BIGINT NOT NULL,
    "tipo" tipo_vinculo NOT NULL,
    "nome_programa" TEXT NOT NULL,
    FOREIGN KEY("id_pesquisador") REFERENCES "pesquisador"("id_pesquisador"),
    FOREIGN KEY("instituicao") REFERENCES "instituicao"("id")
);
COMMENT ON COLUMN "vinculo"."tipo" IS '(primaria, secundario, pos)';

CREATE TABLE "publicacao"(
    "id_publicacao" SERIAL NOT NULL PRIMARY KEY,
    "id_pesquisador" BIGINT NOT NULL,
    "doi" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    FOREIGN KEY("id_pesquisador") REFERENCES "pesquisador"("id_pesquisador")
);

CREATE TABLE "equipamento"(
    "id_equipamento" SERIAL NOT NULL PRIMARY KEY,
    "id_pesquisador" BIGINT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao_tecnica" TEXT NOT NULL,
    "localidade" BIGINT NOT NULL,
    FOREIGN KEY("id_pesquisador") REFERENCES "pesquisador"("id_pesquisador"),
    FOREIGN KEY("localidade") REFERENCES "localidade"("id_localidade")
);

CREATE TABLE "mensagem"(
    "id_mensagem" SERIAL NOT NULL PRIMARY KEY,
    "id_remetente" BIGINT NOT NULL,
    "is_global" BOOLEAN NOT NULL,
    "id_destinatario" BIGINT NULL,
    "conteudo" TEXT NOT NULL,
    "data_envio" TIMESTAMP WITH TIME ZONE DEFAULT timezone('America/Sao_Paulo', now()) NOT NULL,
    FOREIGN KEY("id_remetente") REFERENCES "pesquisador"("id_pesquisador"),
    FOREIGN KEY("id_destinatario") REFERENCES "pesquisador"("id_pesquisador")
);

CREATE TABLE "contribuicao"(
    "id_contribuicao" SERIAL NOT NULL PRIMARY KEY,
    "id_pesquisador" BIGINT NOT NULL,
    "valor" BIGINT NOT NULL,
    "data_pagamento" DATE NOT NULL,
    "metodo" metodo_pagamento NOT NULL,
    FOREIGN KEY("id_pesquisador") REFERENCES "pesquisador"("id_pesquisador")
);

CREATE TABLE "rede_social"(
    "id_rede" SERIAL NOT NULL PRIMARY KEY,
    "id_pesquisador" BIGINT NOT NULL,
    "plataforma" plataforma_social NOT NULL,
    "url" TEXT NOT NULL,
    FOREIGN KEY("id_pesquisador") REFERENCES "pesquisador"("id_pesquisador")
);

CREATE TABLE "membro_grupo"(
    "id_grupo" BIGINT NOT NULL,
    "id_pesquisador" BIGINT NOT NULL,
    PRIMARY KEY ("id_grupo", "id_pesquisador"),
    FOREIGN KEY("id_grupo") REFERENCES "grupo_pesquisa"("id_grupo"),
    FOREIGN KEY("id_pesquisador") REFERENCES "pesquisador"("id_pesquisador")
);

CREATE TABLE "pos_graduacao"(
    "id_pos" SERIAL NOT NULL PRIMARY KEY,
    "id_pesquisador" BIGINT NOT NULL,
    "id_instituicao" BIGINT NOT NULL,
    "titulo" TEXT NOT NULL,
    FOREIGN KEY("id_pesquisador") REFERENCES "pesquisador"("id_pesquisador"),
    FOREIGN KEY("id_instituicao") REFERENCES "instituicao"("id")
);

CREATE TABLE "org_sociedades"(
    "id_sociedade" SERIAL NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "id_pesquisador" BIGINT NOT NULL,
    FOREIGN KEY("id_pesquisador") REFERENCES "pesquisador"("id_pesquisador")
);

CREATE TABLE "password_reset_tokens"(
    "id" SERIAL NOT NULL PRIMARY KEY,
    "token" VARCHAR(255) NOT NULL UNIQUE,
    "id_pesquisador" BIGINT NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    FOREIGN KEY("id_pesquisador") REFERENCES "pesquisador"("id_pesquisador") ON DELETE CASCADE
);

CREATE TABLE "configuracao"(
    "chave" VARCHAR(100) NOT NULL PRIMARY KEY,
    "valor" TEXT NOT NULL
);

INSERT INTO "configuracao" ("chave", "valor") VALUES ('mensalidade', '100');

CREATE EXTENSION unaccent;
