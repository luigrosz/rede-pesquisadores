import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import pool from '../db/pool.js';

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'projetofarmaciateste@gmail.com',
    pass: process.env.MAIL_SECRET,
  },
});

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query(
      'SELECT id_pesquisador, nome, email, password, is_enabled, is_admin FROM "pesquisador" WHERE email = $1',
      [email]
    );

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

    const accessToken = jwt.sign(
      {
        id: user.id_pesquisador,
        email: user.email,
        isAdmin: user.is_admin
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      {
        id: user.id_pesquisador,
        email: user.email,
        isAdmin: user.is_admin
      },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Sucesso',
      accessToken,
      refreshToken,
      nome: user.nome
    });

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
      {
        id: decoded.id,
        email: decoded.email,
        isAdmin: decoded.isAdmin
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const newRefreshToken = jwt.sign(
      {
        id: decoded.id,
        email: decoded.email,
        isAdmin: decoded.isAdmin
      },
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

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query('SELECT id_pesquisador, nome FROM pesquisador WHERE email = $1', [email]);
    // Responde sempre com sucesso para não revelar se o email existe
    if (result.rows.length === 0) return res.json({ message: 'Se este email estiver cadastrado, você receberá um link de recuperação.' });

    const { id_pesquisador, nome } = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    await pool.query('DELETE FROM password_reset_tokens WHERE id_pesquisador = $1', [id_pesquisador]);
    await pool.query('INSERT INTO password_reset_tokens (token, id_pesquisador, expires_at) VALUES ($1, $2, $3)', [token, id_pesquisador, expiresAt]);

    const resetLink = `http://localhost:5173/reset-password?token=${token}`;
    await transporter.sendMail({
      from: 'NOME_DO_APP projetofarmaciateste@gmail.com',
      to: email,
      subject: 'Recuperação de senha',
      text: `Olá, ${nome}!\n\nClique no link abaixo para redefinir sua senha (válido por 30 minutos):\n\n${resetLink}\n\nSe você não solicitou a recuperação, ignore este email.`,
    });

    res.json({ message: 'Se este email estiver cadastrado, você receberá um link de recuperação.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token e senha são obrigatórios.' });

  try {
    const result = await pool.query('SELECT id_pesquisador, expires_at FROM password_reset_tokens WHERE token = $1', [token]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Token inválido.' });

    const { id_pesquisador, expires_at } = result.rows[0];
    if (new Date() > new Date(expires_at)) {
      await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);
      return res.status(400).json({ error: 'Token expirado.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await pool.query('UPDATE pesquisador SET password = $1 WHERE id_pesquisador = $2', [hashed, id_pesquisador]);
    await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);

    res.json({ message: 'Senha redefinida com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

export default router;
