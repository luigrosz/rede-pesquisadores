import jwt from 'jsonwebtoken';
import { getEnabledUser } from './authMiddleware.js';

const optionalAuthMiddleware = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  if (!accessToken) return next();

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    const user = await getEnabledUser(decoded.id);
    if (user) {
      req.user = {
        id: user.id_pesquisador,
        email: user.email,
        isAdmin: user.is_admin,
        isMasterAdmin: user.is_master_admin,
      };
    }
  } catch {
    // invalid, expired, or disabled — continue as unauthenticated
  }
  next();
};

export default optionalAuthMiddleware;
