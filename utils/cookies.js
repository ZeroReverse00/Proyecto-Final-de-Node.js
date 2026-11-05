// Cookies de sesión: httpOnly (inaccesibles desde JS), SameSite=Lax y Secure en producción
const config = require('../config');

const base = { httpOnly: true, sameSite: 'lax', secure: config.https, path: '/' };
const maxAge = config.jwt.refreshDays * 24 * 60 * 60 * 1000;

// El JWT de acceso lleva su propia expiración (corta); la cookie solo lo transporta.
function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie('accessToken', accessToken, { ...base, maxAge });
  res.cookie('refreshToken', refreshToken, { ...base, maxAge });
}

function clearAuthCookies(res) {
  res.clearCookie('accessToken', base);
  res.clearCookie('refreshToken', base);
}

module.exports = { setAuthCookies, clearAuthCookies };
