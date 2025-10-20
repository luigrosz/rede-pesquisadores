import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query('SELECT id_pesquisador, email, password, is_enabled FROM "pesquisador" WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Credenciais inválidas.' });
    }

    const user = userResult.rows[0];

    if (!user.is_enabled) {
      return res.status(403).json({ error: 'Sua conta ainda nao foi aprovada por um administrador.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Credenciais invalidas.' });
    }

    const token = jwt.sign(
      { id: user.id_pesquisador, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({ message: 'Sucesso', token });

  } catch (err) {
    console.error('Erro durante o processo de autenticacao:', err);
    res.status(500).json({ error: 'Erro interno do servidor, por favor tente mais tarde.' });
  }
});

router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Token de atualizacao nao encontrado.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    const newAccessToken = jwt.sign(
      { id: decoded.id, email: decoded.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const newRefreshToken = jwt.sign(
      { id: decoded.id, email: decoded.email },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Token renovado com sucesso!',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

  } catch (err) {
    console.error('Erro ao renovar o token:', err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token de atualizacao expirado. Por favor, faça login novamente.' });
    }
    return res.status(403).json({ error: 'Token de atualização invalido.' });
  }
});

export default router;
