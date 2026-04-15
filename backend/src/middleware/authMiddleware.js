import jwt from 'jsonwebtoken';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

const authMiddleware = (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  if (!accessToken && !refreshToken) {
    return res.status(401).json({ message: 'Não autenticado.' });
  }

  try {
    req.user = jwt.verify(accessToken, process.env.JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError' && refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const newAccessToken = jwt.sign(
          { id: decoded.id, email: decoded.email, isAdmin: decoded.isAdmin },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        res.cookie('accessToken', newAccessToken, { ...cookieOptions, maxAge: 60 * 60 * 1000 });
        req.user = decoded;
        next();
      } catch {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        return res.status(401).json({ message: 'Sessão expirada. Por favor, faça login novamente.' });
      }
    } else {
      return res.status(401).json({ message: 'Token inválido.' });
    }
  }
};

export default authMiddleware;
