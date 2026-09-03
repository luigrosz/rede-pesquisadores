import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'strict',
};

const rejectSession = (res, message = 'Sessão expirada. Por favor, faça login novamente.') => {
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  return res.status(401).json({ message });
};

const getEnabledUser = async (id) => {
  const result = await pool.query(
    'SELECT id_pesquisador, email, is_admin, is_master_admin, is_enabled FROM "pesquisador" WHERE id_pesquisador = $1',
    [id]
  );
  const user = result.rows[0];
  return user && user.is_enabled ? user : null;
};

const authMiddleware = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  if (!accessToken && !refreshToken) {
    return res.status(401).json({ message: 'Não autenticado.' });
  }

  try {
    const decoded = accessToken
      ? jwt.verify(accessToken, process.env.JWT_SECRET)
      : null;
    const user = await getEnabledUser(decoded.id);

    if (!user) {
      return rejectSession(res, 'Sua conta não está habilitada para acessar a plataforma.');
    }

    req.user = {
      id: user.id_pesquisador,
      email: user.email,
      isAdmin: user.is_admin,
      isMasterAdmin: user.is_master_admin,
    };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError' && refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await getEnabledUser(decoded.id);

        if (!user) {
          return rejectSession(res, 'Sua conta não está habilitada para acessar a plataforma.');
        }

        const newAccessToken = jwt.sign(
          {
            id: user.id_pesquisador,
            email: user.email,
            isAdmin: user.is_admin,
            isMasterAdmin: user.is_master_admin,
          },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        res.cookie('accessToken', newAccessToken, { ...cookieOptions, maxAge: 60 * 60 * 1000 });
        req.user = {
          id: user.id_pesquisador,
          email: user.email,
          isAdmin: user.is_admin,
          isMasterAdmin: user.is_master_admin,
        };
        return next();
      } catch (refreshErr) {
        return rejectSession(
          res,
          refreshErr.name === 'TokenExpiredError'
            ? 'Sessão expirada. Por favor, faça login novamente.'
            : 'Token inválido.'
        );
      }
    }

    return rejectSession(res, 'Token inválido.');
  }
};

export { getEnabledUser };
export default authMiddleware;
