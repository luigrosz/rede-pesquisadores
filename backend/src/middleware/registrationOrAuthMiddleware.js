import authMiddleware from './authMiddleware.js';
import registrationMiddleware from './registrationMiddleware.js';

const registrationOrAuthMiddleware = (req, res, next) => {
  if (!req.cookies.accessToken && !req.cookies.refreshToken && req.cookies.registrationToken) {
    return registrationMiddleware(req, res, next);
  }
  return authMiddleware(req, res, next);
};

export default registrationOrAuthMiddleware;
