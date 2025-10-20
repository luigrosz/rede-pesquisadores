import express from 'express';
import pool from '../db/pool.js';
import bcrypt from 'bcrypt';
import { findOrCreateAreaDoutorado, findOrCreateGrupoPesquisa, findOrCreateLocalidade, findOrCreateInstituicao } from '../helper/pesquisador.js';
// import authMiddleware from '../middleware/authMiddleware.js'; // testar pagina admin - discomente

const router = express.Router();

// router.use(authMiddleware); // testar pagina admin - discomente

const salt = 10;

const estadosBrasileiros = [
  'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
  'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
  'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
  'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
  'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
];

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "pesquisador"');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro na requisicao de pesquisadores:', err);
    res.status(500).json({ error: 'Erro interno do servidor, por favor tente mais tarde.' });
  }
});

router.get('/pesquisar', async (req, res) => {
  try {
    const {
      nome,
      estado,
      area,
      sociedade,
      area_doutorado,
      programa_de_pos,
      disciplina,
      pesquisador_pq,
      sbfte,
      equipamento
    } = req.query;

    let query = `
      SELECT DISTINCT p.id_pesquisador, p.nome, p.link_lattes, p.email, p.celular,
             p.pagina_institucional, p.pq, p.is_admin, p.editor_revista,
             p.laboratorio, p.sbfte, p.is_enabled,
             l.nome_cidade, l.nome_estado,
             ad.titulo AS area_doutorado_titulo
      FROM "pesquisador" p
      LEFT JOIN "localidade" l ON p.localidade = l.id_localidade
      LEFT JOIN "area_doutorado" ad ON p.area_doutorado = ad.id_doutorado
    `;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (area) {
      query += ` LEFT JOIN "area_de_pesquisa" ap ON p.id_pesquisador = ap.id_pesquisador`;
    }
    if (sociedade) {
      query += ` LEFT JOIN "org_sociedades" os ON p.id_pesquisador = os.id_pesquisador`;
    }
    if (programa_de_pos) {
      query += ` LEFT JOIN "pos_graduacao" pg ON p.id_pesquisador = pg.id_pesquisador`;
    }
    if (disciplina) {
      query += ` LEFT JOIN "disciplinas" d ON p.id_pesquisador = d.id_pesquisador`;
    }

    if (nome) {
      conditions.push(`unaccent(p.nome) ILIKE unaccent($${paramIndex++})`);
      params.push(`%${nome}%`);
    }
    if (estado) {
      conditions.push(`unaccent(l.nome_estado) ILIKE unaccent($${paramIndex++})`);
      params.push(`%${estado}%`);
    }
    if (area) {
      conditions.push(`unaccent(ap.descricao) ILIKE unaccent($${paramIndex++})`);
      params.push(`%${area}%`);
    }
    if (sociedade) {
      conditions.push(`unaccent(os.nome) ILIKE unaccent($${paramIndex++})`);
      params.push(`%${sociedade}%`);
    }
    if (area_doutorado) {
      conditions.push(`unaccent(ad.titulo) ILIKE unaccent($${paramIndex++})`);
      params.push(`%${area_doutorado}%`);
    }
    if (programa_de_pos) {
      conditions.push(`unaccent(pg.titulo) ILIKE unaccent($${paramIndex++})`);
      params.push(`%${programa_de_pos}%`);
    }
    if (disciplina) {
      conditions.push(`unaccent(d.descricao) ILIKE unaccent($${paramIndex++})`);
      params.push(`%${disciplina}%`);
    }
    if (pesquisador_pq !== undefined) {
      conditions.push(`p.pq = $${paramIndex++}`);
      params.push(pesquisador_pq === 'true');
    }
    if (sbfte !== undefined) {
      conditions.push(`p.sbfte = $${paramIndex++}`);
      params.push(sbfte === 'true');
    }
    if (equipamento) {
      conditions.push(`unaccent(p.laboratorio) ILIKE unaccent($${paramIndex++})`);
      params.push(`%${equipamento}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    const result = await pool.query(query, params);
    res.json(result.rows);

  } catch (err) {
    console.error('Erro na requisicao de busca de pesquisadores:', err);
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

    if (!estadosBrasileiros.includes(localidade_data.nome_estado)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'O estado fornecido é inválido.' });
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

router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { is_enabled } = req.body;

  if (typeof is_enabled !== 'boolean') {
    return res.status(400).json({ error: 'O valor de is_enabled deve ser um booleano.' });
  }

  try {
    const result = await pool.query(
      'UPDATE "pesquisador" SET is_enabled = $1 WHERE id_pesquisador = $2 RETURNING id_pesquisador, is_enabled;',
      [is_enabled, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pesquisador nao encontrado.' });
    }

    res.json({ message: `Status do pesquisador ${id} atualizado para ${is_enabled ? 'habilitado' : 'desabilitado'}.`, pesquisador: result.rows[0] });
  } catch (err) {
    console.error(`Erro ao atualizar status do pesquisador com ID ${id}:`, err);
    res.status(500).json({ error: 'Erro interno do servidor, por favor tente mais tarde.', details: err.message });
  }
});

export default router;
