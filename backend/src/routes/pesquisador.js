import express from 'express';
import pool from '../db/pool.js';
import bcrypt from 'bcrypt';
import winston from 'winston';

import { findOrCreateAreaDoutorado, findOrCreateGrupoPesquisa, findOrCreateLocalidade, findOrCreateInstituicao } from '../helper/pesquisador.js';
import authMiddleware from '../middleware/authMiddleware.js';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/admin-actions.log' })
  ],
});

const router = express.Router();

const salt = 10;
const MONTHLY_FEE = 20;

const estadosBrasileiros = [
  'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
  'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
  'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
  'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
  'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
];

router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      nome, email, password, celular, link_lattes, localidade_data,
      pagina_institucional, pq, is_admin, editor_revista, laboratorio,
      area_doutorado_data, sbfte, vinculos_data, grupos_pesquisa_data,
      areas_pesquisa, disciplinas, publicacoes, redes_sociais,
      revistas_editadas, pos_graduacoes, org_sociedades,
      servicos, equipamentos
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
    if (!link_lattes || !link_lattes.startsWith('http://lattes.cnpq.br/')) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'O Link Lattes deve começar com http://lattes.cnpq.br/' });
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
    console.error('Erro ao cadastrar pesquisador:', err);
    res.status(500).json({ error: 'Erro interno do servidor.', details: err.message });
  } finally {
    client.release();
  }
});

async function executePesquisadorSearch(searchParams) {
  try {
    const {
      nome,
      instituicao,
      estado,
      area,
      sociedade,
      area_doutorado,
      programa_de_pos,
      disciplina,
      pesquisador_pq,
      sbfte,
      equipamento,
      servico,
      is_enabled
    } = searchParams;

    let query = `
      SELECT DISTINCT p.id_pesquisador, p.nome, p.link_lattes, p.email, p.celular,
             p.pagina_institucional, p.pq, p.is_admin, p.editor_revista,
             p.laboratorio, p.sbfte,
             CASE WHEN p.enabled_until IS NOT NULL AND p.enabled_until > NOW() THEN TRUE ELSE FALSE END AS is_enabled,
             p.enabled_until,
             l.nome_cidade, l.nome_estado,
             ad.titulo AS area_doutorado_titulo,
             i.nome AS nome_instituicao,
             v.nome_programa
      FROM "pesquisador" p
      LEFT JOIN "localidade" l ON p.localidade = l.id_localidade
      LEFT JOIN "area_doutorado" ad ON p.area_doutorado = ad.id_doutorado
      LEFT JOIN "vinculo" v ON p.id_pesquisador = v.id_pesquisador AND v.tipo = 'primaria'
      LEFT JOIN "instituicao" i ON v.instituicao = i.id
    `;

    // O master admin nunca aparece em buscas
    const conditions = [`p.email != 'admin@admin.com'`];
    const params = [];
    let paramIndex = 1;

    if (area) query += ` LEFT JOIN "area_de_pesquisa" ap ON p.id_pesquisador = ap.id_pesquisador`;
    if (sociedade) query += ` LEFT JOIN "org_sociedades" os ON p.id_pesquisador = os.id_pesquisador`;
    if (programa_de_pos) query += ` LEFT JOIN "pos_graduacao" pg ON p.id_pesquisador = pg.id_pesquisador`;
    if (disciplina) query += ` LEFT JOIN "disciplinas" d ON p.id_pesquisador = d.id_pesquisador`;
    if (equipamento) query += ` LEFT JOIN "equipamento" eq ON p.id_pesquisador = eq.id_pesquisador`;
    if (servico) query += ` LEFT JOIN "servico" s ON p.id_pesquisador = s.id_pesquisador`;

    if (nome) { conditions.push(`unaccent(p.nome) ILIKE unaccent($${paramIndex++})`); params.push(`%${nome}%`); }
    if (instituicao) { conditions.push(`unaccent(i.nome) ILIKE unaccent($${paramIndex++})`); params.push(`%${instituicao}%`); }
    if (estado) { conditions.push(`unaccent(l.nome_estado) ILIKE unaccent($${paramIndex++})`); params.push(`%${estado}%`); }
    if (area) { conditions.push(`unaccent(ap.descricao) ILIKE unaccent($${paramIndex++})`); params.push(`%${area}%`); }
    if (sociedade) { conditions.push(`unaccent(os.nome) ILIKE unaccent($${paramIndex++})`); params.push(`%${sociedade}%`); }
    if (area_doutorado) { conditions.push(`unaccent(ad.titulo) ILIKE unaccent($${paramIndex++})`); params.push(`%${area_doutorado}%`); }
    if (programa_de_pos) { conditions.push(`unaccent(pg.titulo) ILIKE unaccent($${paramIndex++})`); params.push(`%${programa_de_pos}%`); }
    if (disciplina) { conditions.push(`unaccent(d.descricao) ILIKE unaccent($${paramIndex++})`); params.push(`%${disciplina}%`); }
    if (pesquisador_pq !== undefined) { conditions.push(`p.pq = $${paramIndex++}`); params.push(pesquisador_pq === true || pesquisador_pq === 'true'); }
    if (sbfte !== undefined) { conditions.push(`p.sbfte = $${paramIndex++}`); params.push(sbfte === true || sbfte === 'true'); }

    if (equipamento) {
      conditions.push(`(
        unaccent(p.laboratorio) ILIKE unaccent($${paramIndex}) OR
        unaccent(eq.nome) ILIKE unaccent($${paramIndex}) OR
        unaccent(eq.descricao_tecnica) ILIKE unaccent($${paramIndex})
      )`);
      params.push(`%${equipamento}%`);
      paramIndex++;
    }

    if (servico) {
      conditions.push(`(
        unaccent(s.nome) ILIKE unaccent($${paramIndex}) OR
        unaccent(s.descricao) ILIKE unaccent($${paramIndex}) OR
        unaccent(s.area) ILIKE unaccent($${paramIndex})
      )`);
      params.push(`%${servico}%`);
      paramIndex++;
    }

    if (is_enabled !== undefined) {
      if (is_enabled === true || is_enabled === 'true') {
        conditions.push(`(p.is_admin = TRUE OR (p.enabled_until IS NOT NULL AND p.enabled_until > NOW()))`);
      } else {
        conditions.push(`(p.is_admin = FALSE AND (p.enabled_until IS NULL OR p.enabled_until <= NOW()))`);
      }
    }

    if (conditions.length > 0) query += ` WHERE ` + conditions.join(' AND ');

    query += ` LIMIT 50`;
    const result = await pool.query(query, params);
    return result.rows;
  } catch (err) {
    console.error('Erro na execucao da busca de pesquisadores:', err);
    throw new Error('Erro interno do servidor ao buscar pesquisadores.');
  }
}

router.get('/mensalidade', async (req, res) => {
  try {
    const result = await pool.query(`SELECT valor FROM configuracao WHERE chave = 'mensalidade'`);
    res.json({ mensalidade: Number(result.rows[0].valor) });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.patch('/mensalidade', async (req, res) => {
  try {
    const result = await pool.query(`SELECT email FROM pesquisador WHERE id_pesquisador = $1`, [req.body.user_id]);
    if (!result.rows.length || result.rows[0].email !== 'admin@admin.com') {
      return res.status(403).json({ error: 'Apenas o admin master pode alterar a mensalidade.' });
    }
    const { valor } = req.body;
    if (!valor || isNaN(valor) || Number(valor) <= 0) {
      return res.status(400).json({ error: 'Valor inválido.' });
    }
    await pool.query(`UPDATE configuracao SET valor = $1 WHERE chave = 'mensalidade'`, [valor]);
    res.json({ mensalidade: Number(valor) });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "pesquisador"');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/pesquisar', async (req, res) => {
  try {
    const result = await executePesquisadorSearch(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erro interno', details: err.message });
  }
});

router.post('/pesquisar/ativos', async (req, res) => {
  try {
    const searchParams = { ...req.body, is_enabled: true };
    const result = await executePesquisadorSearch(searchParams);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erro interno', details: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pesquisadorResult = await pool.query(
      'SELECT p.id_pesquisador, p.nome, p.link_lattes, p.email, p.celular, p.pagina_institucional, p.pq, p.is_admin, p.editor_revista, p.laboratorio, p.sbfte, p.is_enabled, p.enabled_until, p.area_doutorado, l.nome_cidade, l.nome_estado FROM "pesquisador" p LEFT JOIN "localidade" l ON p.localidade = l.id_localidade WHERE p.id_pesquisador = $1',
      [id]
    );

    if (pesquisadorResult.rows.length === 0) return res.status(404).json({ error: 'Pesquisador nao encontrado' });
    const pesquisador = pesquisadorResult.rows[0];

    const posGrad = await pool.query('SELECT pg.titulo, i.nome AS instituicao_nome FROM "pos_graduacao" pg JOIN "instituicao" i ON pg.id_instituicao = i.id WHERE pg.id_pesquisador = $1', [id]);
    pesquisador.pos_graduacoes = posGrad.rows;

    const pubs = await pool.query('SELECT doi, titulo FROM "publicacao" WHERE id_pesquisador = $1', [id]);
    pesquisador.publicacoes = pubs.rows;

    const redes = await pool.query('SELECT plataforma, url FROM "rede_social" WHERE id_pesquisador = $1', [id]);
    pesquisador.redes_sociais = redes.rows;

    const areas = await pool.query('SELECT descricao FROM "area_de_pesquisa" WHERE id_pesquisador = $1', [id]);
    pesquisador.areas_pesquisa = areas.rows;

    const vinculos = await pool.query('SELECT v.tipo, v.nome_programa, i.nome AS instituicao_nome FROM "vinculo" v JOIN "instituicao" i ON v.instituicao = i.id WHERE v.id_pesquisador = $1', [id]);
    pesquisador.vinculos_institucionais = vinculos.rows;

    const grupos = await pool.query('SELECT gp.nome, gp.descricao, gp.link, i.nome AS instituicao_nome FROM "membro_grupo" mg JOIN "grupo_pesquisa" gp ON mg.id_grupo = gp.id_grupo LEFT JOIN "instituicao" i ON gp.instituicao = i.id WHERE mg.id_pesquisador = $1', [id]);
    pesquisador.grupos_pesquisa = grupos.rows;

    const soc = await pool.query('SELECT nome FROM "org_sociedades" WHERE id_pesquisador = $1', [id]);
    pesquisador.sociedades = soc.rows;

    const disc = await pool.query('SELECT descricao FROM "disciplinas" WHERE id_pesquisador = $1', [id]);
    pesquisador.disciplinas_lecionadas = disc.rows;

    const servicosResult = await pool.query(
      `SELECT s.nome, s.descricao, s.area, s.tipo, l.nome_cidade as cidade, l.nome_estado as estado
       FROM "servico" s
       JOIN "localidade" l ON s.localidade = l.id_localidade
       WHERE s.id_pesquisador = $1`,
      [id]
    );
    pesquisador.servicos = servicosResult.rows;

    const equipamentosResult = await pool.query(
      `SELECT e.nome, e.descricao_tecnica, l.nome_cidade as cidade, l.nome_estado as estado
       FROM "equipamento" e
       JOIN "localidade" l ON e.localidade = l.id_localidade
       WHERE e.id_pesquisador = $1`,
      [id]
    );
    pesquisador.equipamentos = equipamentosResult.rows;

    res.json(pesquisador);
  } catch (err) {
    console.error(`Erro ao buscar pesquisador ${req.params.id}:`, err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      nome, email, celular, link_lattes, pagina_institucional, laboratorio,
      localidade, pq, sbfte, editor_revista,
      pos_graduacoes, publicacoes, redes_sociais, areas_pesquisa, vinculos,
      grupos_pesquisa, org_sociedades, disciplinas, servicos, equipamentos
    } = req.body;

    let localidade_id = null;
    if (localidade && localidade.nome_cidade && localidade.nome_estado) {
      localidade_id = await findOrCreateLocalidade(client, localidade);
    }

    const updateQuery = `
      UPDATE "pesquisador" SET
        nome = COALESCE($1, nome),
        email = COALESCE($2, email),
        celular = COALESCE($3, celular),
        link_lattes = COALESCE($4, link_lattes),
        pagina_institucional = COALESCE($5, pagina_institucional),
        laboratorio = COALESCE($6, laboratorio),
        pq = COALESCE($7, pq),
        sbfte = COALESCE($8, sbfte),
        editor_revista = COALESCE($9, editor_revista),
        localidade = COALESCE($10, localidade)
      WHERE id_pesquisador = $11
    `;
    await client.query(updateQuery, [
      nome, email, celular, link_lattes, pagina_institucional, laboratorio,
      pq, sbfte, editor_revista, localidade_id, id
    ]);

    await client.query('DELETE FROM "pos_graduacao" WHERE id_pesquisador = $1', [id]);
    if (pos_graduacoes && pos_graduacoes.length > 0) {
      for (const pos of pos_graduacoes) {
        if (pos.titulo && pos.instituicao_nome) {
          const instId = await findOrCreateInstituicao(client, pos.instituicao_nome);
          await client.query('INSERT INTO "pos_graduacao" (id_pesquisador, id_instituicao, titulo) VALUES ($1, $2, $3)', [id, instId, pos.titulo]);
        }
      }
    }

    await client.query('DELETE FROM "publicacao" WHERE id_pesquisador = $1', [id]);
    if (publicacoes) {
      for (const pub of publicacoes) await client.query('INSERT INTO "publicacao" (id_pesquisador, doi, titulo) VALUES ($1, $2, $3)', [id, pub.doi, pub.titulo]);
    }

    await client.query('DELETE FROM "rede_social" WHERE id_pesquisador = $1', [id]);
    if (redes_sociais) {
      for (const rede of redes_sociais) await client.query('INSERT INTO "rede_social" (id_pesquisador, plataforma, url) VALUES ($1, $2, $3)', [id, rede.plataforma, rede.url]);
    }

    await client.query('DELETE FROM "area_de_pesquisa" WHERE id_pesquisador = $1', [id]);
    if (areas_pesquisa) {
      for (const area of areas_pesquisa) await client.query('INSERT INTO "area_de_pesquisa" (id_pesquisador, descricao) VALUES ($1, $2)', [id, area.descricao]);
    }

    await client.query('DELETE FROM "vinculo" WHERE id_pesquisador = $1', [id]);
    if (vinculos) {
      for (const v of vinculos) {
        const instId = await findOrCreateInstituicao(client, v.instituicao_nome);
        await client.query('INSERT INTO "vinculo" (id_pesquisador, instituicao, tipo, nome_programa) VALUES ($1, $2, $3, $4)', [id, instId, v.tipo, v.nome_programa]);
      }
    }

    await client.query('DELETE FROM "membro_grupo" WHERE id_pesquisador = $1', [id]);
    if (grupos_pesquisa) {
      for (const g of grupos_pesquisa) {
        const grpId = await findOrCreateGrupoPesquisa(client, { nome: g.nome, descricao: g.descricao, instituicao_nome: g.instituicao_nome, link: g.link });
        await client.query('INSERT INTO "membro_grupo" (id_pesquisador, id_grupo) VALUES ($1, $2)', [id, grpId]);
      }
    }

    await client.query('DELETE FROM "org_sociedades" WHERE id_pesquisador = $1', [id]);
    if (org_sociedades) {
      for (const org of org_sociedades) await client.query('INSERT INTO "org_sociedades" (id_pesquisador, nome) VALUES ($1, $2)', [id, org.nome]);
    }

    await client.query('DELETE FROM "disciplinas" WHERE id_pesquisador = $1', [id]);
    if (disciplinas) {
      for (const disc of disciplinas) await client.query('INSERT INTO "disciplinas" (id_pesquisador, descricao) VALUES ($1, $2)', [id, disc.descricao || disc.nome]);
    }

    await client.query('DELETE FROM "servico" WHERE id_pesquisador = $1', [id]);
    if (servicos) {
      for (const s of servicos) {
        if (s.nome && s.cidade && s.estado) {
          const locId = await findOrCreateLocalidade(client, { nome_cidade: s.cidade, nome_estado: s.estado });
          await client.query('INSERT INTO "servico" (id_pesquisador, nome, descricao, area, tipo, localidade) VALUES ($1, $2, $3, $4, $5, $6)', [id, s.nome, s.descricao, s.area, s.tipo, locId]);
        }
      }
    }

    await client.query('DELETE FROM "equipamento" WHERE id_pesquisador = $1', [id]);
    if (equipamentos) {
      for (const e of equipamentos) {
        if (e.nome && e.cidade && e.estado) {
          const locId = await findOrCreateLocalidade(client, { nome_cidade: e.cidade, nome_estado: e.estado });
          await client.query('INSERT INTO "equipamento" (id_pesquisador, nome, descricao_tecnica, localidade) VALUES ($1, $2, $3, $4)', [id, e.nome, e.descricao_tecnica, locId]);
        }
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Profile updated' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update error:', err);
    res.status(500).json({ error: 'Update failed' });
  } finally {
    client.release();
  }
});

router.use(authMiddleware);

router.post('/:id/contribuicao', async (req, res) => {
  const { id } = req.params;
  const { valor, metodo, data_pagamento, user_id } = req.body;

  if (!valor || !metodo) {
    return res.status(400).json({ error: 'Dados de contribuicao incompletos. Valor e metodo são obrigatórios.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const contribuicaoInsertQuery = `INSERT INTO "contribuicao" (id_pesquisador, valor, data_pagamento, metodo) VALUES ($1, $2, $3, $4) RETURNING *;`;
    const contribuicaoResult = await client.query(contribuicaoInsertQuery, [id, valor, data_pagamento, metodo]);

    const currentPesquisadorResult = await client.query('SELECT enabled_until FROM "pesquisador" WHERE id_pesquisador = $1;', [id]);
    const currentPesquisador = currentPesquisadorResult.rows[0];
    let currentEnabledUntil = currentPesquisador.enabled_until ? new Date(currentPesquisador.enabled_until) : null;
    const mensalidadeResult = await client.query(`SELECT valor FROM configuracao WHERE chave = 'mensalidade'`);
    const mensalidade = Number(mensalidadeResult.rows[0].valor);
    const monthsToEnable = Math.floor(valor / mensalidade);
    let newEnabledUntil;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (currentEnabledUntil && currentEnabledUntil > today) {
      newEnabledUntil = new Date(currentEnabledUntil);
    } else {
      newEnabledUntil = new Date(data_pagamento);
    }
    newEnabledUntil.setMonth(newEnabledUntil.getMonth() + monthsToEnable);

    const updatePesquisadorQuery = `UPDATE "pesquisador" SET is_enabled = TRUE, enabled_until = $1 WHERE id_pesquisador = $2 RETURNING id_pesquisador, is_enabled, enabled_until;`;
    const updatePesquisadorResult = await client.query(updatePesquisadorQuery, [newEnabledUntil, id]);

    await client.query('COMMIT');

    logger.info({ admin_id: user_id, action: 'ADD_CONTRIBUICAO', target_id: Number(id), timestamp: new Date() });

    res.status(201).json({
      message: 'Contribuição registrada.',
      contribuicao: contribuicaoResult.rows[0],
      pesquisador_status_updated: updatePesquisadorResult.rows.length > 0,
      enabled_until: newEnabledUntil.toISOString().split('T')[0]
    });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    client.release();
  }
});

router.patch('/:id/admin', async (req, res) => {
  const { id } = req.params;
  const { is_admin, user_id } = req.body;

  if (typeof is_admin !== 'boolean') return res.status(400).json({ error: 'Booleano requerido.' });

  try {
    // Ao promover a admin: is_enabled = TRUE (dispensa aprovação).
    // Ao remover de admin: is_enabled segue enabled_until — ativo se ainda no período de contribuição, desabilitado caso contrário.
    const result = await pool.query(
      'UPDATE "pesquisador" SET is_admin = $1, is_enabled = CASE WHEN $1 = TRUE THEN TRUE ELSE (enabled_until IS NOT NULL AND enabled_until > NOW()) END WHERE id_pesquisador = $2 RETURNING id_pesquisador, nome, email, is_admin;',
      [is_admin, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Não encontrado.' });

    logger.info({ admin_id: user_id, action: is_admin ? 'ADD_ADMIN' : 'REMOVE_ADMIN', target_id: Number(id), timestamp: new Date() });

    res.json({ message: `Admin status: ${is_admin}`, pesquisador: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno.' });
  }
});

export default router;
