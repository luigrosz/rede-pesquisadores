import jwt from 'jsonwebtoken';

const optionalAuthMiddleware = (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  if (!accessToken) return next();

  try {
    req.user = jwt.verify(accessToken, process.env.JWT_SECRET);
  } catch {
    // invalid or expired — continue as unauthenticated
  }
  next();
};

export default optionalAuthMiddleware;
