import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';

const registrationMiddleware = async (req, res, next) => {
  const registrationToken = req.cookies.registrationToken;

  if (!registrationToken) {
    return res.status(401).json({ message: 'Sessão de cadastro não encontrada.' });
  }

  try {
    const decoded = jwt.verify(registrationToken, process.env.JWT_REGISTRATION_SECRET);
    if (decoded.type !== 'registration') {
      return res.status(401).json({ message: 'Token de cadastro inválido.' });
    }

    const result = await pool.query(
      'SELECT id_pesquisador, email, is_enabled FROM "pesquisador" WHERE id_pesquisador = $1',
      [decoded.id]
    );
    const user = result.rows[0];

    if (!user || user.is_enabled) {
      return res.status(403).json({ message: 'A sessão de cadastro não está mais disponível.' });
    }

    req.user = {
      id: user.id_pesquisador,
      email: user.email,
      isAdmin: false,
      isMasterAdmin: false,
      isRegistration: true,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Sessão de cadastro expirada.' });
    }
    return res.status(401).json({ message: 'Token de cadastro inválido.' });
  }
};

export default registrationMiddleware;
