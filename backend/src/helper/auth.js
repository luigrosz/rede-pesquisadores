import jwt from 'jsonwebtoken';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'strict',
};

const registrationCookieOptions = {
  ...cookieOptions,
  path: '/pesquisador',
};

export function clearAuthCookies(res) {
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
}

export function setAuthCookies(res, user) {
  clearRegistrationCookie(res);
  const payload = {
    id: user.id_pesquisador,
    email: user.email,
    isAdmin: user.is_admin,
    isMasterAdmin: user.is_master_admin,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 60 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

export function setRegistrationCookie(res, user) {
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  const payload = {
    id: user.id_pesquisador,
    email: user.email,
    type: 'registration',
  };

  const registrationToken = jwt.sign(payload, process.env.JWT_REGISTRATION_SECRET, { expiresIn: '7d' });
  res.cookie('registrationToken', registrationToken, {
    ...registrationCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearRegistrationCookie(res) {
  res.clearCookie('registrationToken', registrationCookieOptions);
}
