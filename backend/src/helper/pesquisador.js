export async function findOrCreateLocalidade(client, { nome_cidade, nome_estado }) {
  const findQuery = `
    SELECT id_localidade FROM "localidade"
    WHERE unaccent(nome_cidade) ILIKE unaccent($1) AND unaccent(nome_estado) ILIKE unaccent($2);
  `;
  const findResult = await client.query(findQuery, [nome_cidade, nome_estado]);

  if (findResult.rows.length > 0) {
    return findResult.rows[0].id_localidade;
  }

  const insertQuery = `
    INSERT INTO "localidade" (nome_cidade, nome_estado)
    VALUES ($1, $2)
    RETURNING id_localidade;
  `;
  const insertResult = await client.query(insertQuery, [nome_cidade, nome_estado]);
  return insertResult.rows[0].id_localidade;
}

export async function findOrCreateInstituicao(client, instituicao_nome) {
  const findQuery = 'SELECT id FROM "instituicao" WHERE nome ILIKE $1;';
  const findResult = await client.query(findQuery, [instituicao_nome]);

  if (findResult.rows.length > 0) {
    return findResult.rows[0].id;
  }

  const insertQuery = 'INSERT INTO "instituicao" (nome) VALUES ($1) RETURNING id;';
  const insertResult = await client.query(insertQuery, [instituicao_nome]);
  return insertResult.rows[0].id;
}

export async function findOrCreateAreaDoutorado(client, { titulo, instituicao_nome }, id_pesquisador) {
  const instituicao_id = await findOrCreateInstituicao(client, instituicao_nome);

  const findQuery = 'SELECT id_doutorado FROM "area_doutorado" WHERE titulo ILIKE $1 AND instituicao_id = $2 AND id_pesquisador = $3;';
  const findResult = await client.query(findQuery, [titulo, instituicao_id, id_pesquisador]);

  if (findResult.rows.length > 0) {
    return findResult.rows[0].id_doutorado;
  } else {
    const insertQuery = 'INSERT INTO "area_doutorado" (id_pesquisador, titulo, instituicao_id) VALUES ($1, $2, $3) RETURNING id_doutorado;';
    const insertResult = await client.query(insertQuery, [id_pesquisador, titulo, instituicao_id]);
    return insertResult.rows[0].id_doutorado;
  }
}

export async function findOrCreateGrupoPesquisa(client, { nome, descricao, instituicao_nome, link }) {
  const instituicao_id = await findOrCreateInstituicao(client, instituicao_nome);

  const findQuery = 'SELECT id_grupo FROM "grupo_pesquisa" WHERE nome ILIKE $1 AND instituicao = $2;';
  const findResult = await client.query(findQuery, [nome, instituicao_id]);

  if (findResult.rows.length > 0) {
    return findResult.rows[0].id_grupo;
  } else {
    const insertQuery = 'INSERT INTO "grupo_pesquisa" (nome, descricao, instituicao, link) VALUES ($1, $2, $3, $4) RETURNING id_grupo;';
    const insertResult = await client.query(insertQuery, [nome, descricao, instituicao_id, link]);
    return insertResult.rows[0].id_grupo;
  }
}
