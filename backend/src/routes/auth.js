import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import pool from '../db/pool.js';

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_SECRET,
  },
});

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'strict',
};

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query(
      'SELECT id_pesquisador, nome, email, password, is_enabled, is_admin, is_master_admin FROM "pesquisador" WHERE email = $1',
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

    const payload = { id: user.id_pesquisador, email: user.email, isAdmin: user.is_admin, isMasterAdmin: user.is_master_admin };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 60 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    return res.status(200).json({
      message: 'Sucesso',
      nome: user.nome,
      id: user.id_pesquisador,
      isAdmin: user.is_admin,
      isMasterAdmin: user.is_master_admin,
      email: user.email,
    });

  } catch (err) {
    console.error('Erro durante o processo de autenticacao:', err);
    res.status(500).json({ error: 'Erro interno do servidor, por favor tente mais tarde.' });
  }
});

router.post('/refresh-token', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Token de atualizacao nao encontrado.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const payload = { id: decoded.id, email: decoded.email, isAdmin: decoded.isAdmin };

    const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    const newRefreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.cookie('accessToken', newAccessToken, { ...cookieOptions, maxAge: 60 * 60 * 1000 });
    res.cookie('refreshToken', newRefreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({ message: 'Token renovado com sucesso!' });

  } catch (err) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sessão expirada. Por favor, faça login novamente.' });
    }
    return res.status(403).json({ error: 'Token de atualização invalido.' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logout realizado com sucesso.' });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query('SELECT id_pesquisador, nome FROM pesquisador WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.json({ message: 'Se este email estiver cadastrado, você receberá um link de recuperação.' });

    const { id_pesquisador, nome } = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await pool.query('DELETE FROM password_reset_tokens WHERE id_pesquisador = $1', [id_pesquisador]);
    await pool.query('INSERT INTO password_reset_tokens (token, id_pesquisador, expires_at) VALUES ($1, $2, $3)', [token, id_pesquisador, expiresAt]);

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    await transporter.sendMail({
      from: `ConectaFarmaco <${process.env.MAIL_USER}>`,
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
  if (password.length < 8) return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres.' });

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
