import express from 'express';
import pool from '../db/pool.js';
import bcrypt from 'bcrypt';

const router = express.Router();
const salt = 10;

async function findOrCreateLocalidade(client, { nome_cidade, nome_estado }) {
  const findQuery = `
    SELECT id_localidade FROM "localidade"
    WHERE nome_cidade ILIKE $1 AND nome_estado ILIKE $2;
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

async function findOrCreateInstituicao(client, instituicao_nome) {
  const findQuery = 'SELECT id FROM "instituicao" WHERE nome ILIKE $1;';
  const findResult = await client.query(findQuery, [instituicao_nome]);

  if (findResult.rows.length > 0) {
    return findResult.rows[0].id;
  }

  const insertQuery = 'INSERT INTO "instituicao" (nome) VALUES ($1) RETURNING id;';
  const insertResult = await client.query(insertQuery, [instituicao_nome]);
  return insertResult.rows[0].id;
}

async function findOrCreateAreaDoutorado(client, { titulo, instituicao_nome }, id_pesquisador) {
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

async function findOrCreateGrupoPesquisa(client, { nome, descricao, instituicao_nome, link }) {
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

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "pesquisador"');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro na requisicao de pesquisadores:', err);
    res.status(500).json({ error: 'Erro interno do servidor, por favor tente mais tarde.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM "pesquisador" WHERE id_pesquisador = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pesquisador nao encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Erro ao buscar pesquisador com ID ${req.params.id}:`, err);
    res.status(500).json({ error: 'Erro interno do servidor, por favor tente mais tarde.' });
  }
});

router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      nome,
      email,
      password,
      celular,
      link_lattes,
      localidade_data,
      pagina_institucional,
      pq,
      is_admin,
      editor_revista,
      laboratorio,
      area_doutorado_data,
      sbfte,
      vinculos_data,
      grupos_pesquisa_data,
      areas_pesquisa,
      disciplinas,
      publicacoes,
      redes_sociais,
      revistas_editadas,
      pos_graduacoes,
      org_sociedades
    } = req.body;

    const existingPesquisador = await client.query('SELECT id_pesquisador FROM "pesquisador" WHERE email = $1', [email]);
    if (existingPesquisador.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Email ja cadastrado. Por favor, use um email diferente.' });
    }

    if (!localidade_data || !localidade_data.nome_cidade || !localidade_data.nome_estado) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Dados de localidade incompletos.' });
    }
    const localidade_id = await findOrCreateLocalidade(client, localidade_data);

    const hashedPassword = await bcrypt.hash(password, salt);

    const pesquisadorInsertQuery = `
      INSERT INTO "pesquisador" (
        nome, link_lattes, email, password, celular, localidade,
        pagina_institucional, pq, is_admin, editor_revista,
        laboratorio, sbfte, is_enabled, area_doutorado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id_pesquisador;
    `;
    const pesquisadorResult = await client.query(pesquisadorInsertQuery, [
      nome,
      link_lattes,
      email,
      hashedPassword,
      celular,
      localidade_id,
      pagina_institucional,
      pq,
      is_admin,
      editor_revista,
      laboratorio,
      sbfte,
      false,
      null
    ]);
    const id_pesquisador = pesquisadorResult.rows[0].id_pesquisador;

    if (area_doutorado_data && area_doutorado_data.titulo && area_doutorado_data.instituicao_nome) {
      const area_doutorado_id = await findOrCreateAreaDoutorado(client, area_doutorado_data, id_pesquisador);
      await client.query(
        'UPDATE "pesquisador" SET area_doutorado = $1 WHERE id_pesquisador = $2;',
        [area_doutorado_id, id_pesquisador]
      );
    }

    if (vinculos_data && vinculos_data.length > 0) {
      for (const vinculo of vinculos_data) {
        if (!vinculo.instituicao_nome || !vinculo.tipo || !vinculo.nome_programa) {
          throw new Error("Dados de vínculo incompletos.");
        }
        const instituicaoId = await findOrCreateInstituicao(client, vinculo.instituicao_nome);
        await client.query(
          `INSERT INTO "vinculo" (id_pesquisador, instituicao, tipo, nome_programa)
           VALUES ($1, $2, $3, $4);`,
          [id_pesquisador, instituicaoId, vinculo.tipo, vinculo.nome_programa]
        );
      }
    }

    if (grupos_pesquisa_data && grupos_pesquisa_data.length > 0) {
      for (const grupoData of grupos_pesquisa_data) {
        if (!grupoData.nome || !grupoData.descricao || !grupoData.instituicao_nome || !grupoData.link) {
          throw new Error("Dados de grupo de pesquisa incompletos.");
        }
        const id_grupo = await findOrCreateGrupoPesquisa(client, grupoData);
        await client.query(
          `INSERT INTO "membro_grupo" (id_grupo, id_pesquisador) VALUES ($1, $2);`,
          [id_grupo, id_pesquisador]
        );
      }
    }

    if (areas_pesquisa && areas_pesquisa.length > 0) {
      for (const area of areas_pesquisa) {
        await client.query(
          `INSERT INTO "area_de_pesquisa" (descricao, id_pesquisador) VALUES ($1, $2);`,
          [area.descricao, id_pesquisador]
        );
      }
    }

    if (disciplinas && disciplinas.length > 0) {
      for (const disciplina of disciplinas) {
        await client.query(
          `INSERT INTO "disciplinas" (descricao, id_pesquisador) VALUES ($1, $2);`,
          [disciplina.descricao, id_pesquisador]
        );
      }
    }

    if (publicacoes && publicacoes.length > 0) {
      for (const publicacao of publicacoes) {
        await client.query(
          `INSERT INTO "publicacao" (id_pesquisador, doi, titulo) VALUES ($1, $2, $3);`,
          [id_pesquisador, publicacao.doi || null, publicacao.titulo]
        );
      }
    }

    if (redes_sociais && redes_sociais.length > 0) {
      for (const rede of redes_sociais) {
        await client.query(
          `INSERT INTO "rede_social" (id_pesquisador, plataforma, url) VALUES ($1, $2, $3);`,
          [id_pesquisador, rede.plataforma, rede.url]
        );
      }
    }

    if (editor_revista && revistas_editadas && revistas_editadas.length > 0) {
      for (const revista of revistas_editadas) {
        await client.query(
          `INSERT INTO "revistas_editadas" (id_pesquisador, titulo) VALUES ($1, $2);`,
          [id_pesquisador, revista.titulo]
        );
      }
    }

    if (pos_graduacoes && pos_graduacoes.length > 0) {
      for (const pos of pos_graduacoes) {
        if (pos.titulo && pos.instituicao_name) {
          const instituicaoPosId = await findOrCreateInstituicao(client, pos.instituicao_name);
          await client.query(
            `INSERT INTO "pos_graduacao" (id_pesquisador, id_instituicao, titulo) VALUES ($1, $2, $3);`,
            [id_pesquisador, instituicaoPosId, pos.titulo]
          );
        }
      }
    }

    if (org_sociedades && org_sociedades.length > 0) {
      for (const org of org_sociedades) {
        await client.query(
          `INSERT INTO "org_sociedades" (id_pesquisador, nome) VALUES ($1, $2);`,
          [id_pesquisador, org.nome]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Pesquisador e dados relacionados cadastrados com sucesso!', id_pesquisador });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao cadastrar pesquisador e dados relacionados:', err);
    res.status(500).json({ error: 'Erro interno do servidor, por favor tente mais tarde.', details: err.message });
  } finally {
    client.release();
  }
});

export default router;
