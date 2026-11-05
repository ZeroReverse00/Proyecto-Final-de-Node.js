// Generación y verificación de JWT (HS256, con expiración)
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { jwt: cfg } = require('../config');

const VERIFY = { algorithms: ['HS256'] };

function firmarAcceso(user) {
  return jwt.sign({ role: user.role, type: 'access' }, cfg.accessSecret, {
    subject: String(user._id),
    expiresIn: cfg.accessExpiresIn,
    algorithm: 'HS256',
  });
}

function firmarRefresh(user) {
  return jwt.sign({ type: 'refresh' }, cfg.refreshSecret, {
    subject: String(user._id),
    expiresIn: `${cfg.refreshDays}d`,
    jwtid: crypto.randomUUID(), // hace único cada refresh token
    algorithm: 'HS256',
  });
}

function verificarAcceso(token) {
  const payload = jwt.verify(token, cfg.accessSecret, VERIFY);
  if (payload.type !== 'access') throw new Error('Tipo de token inválido');
  return payload;
}

function verificarRefresh(token) {
  const payload = jwt.verify(token, cfg.refreshSecret, VERIFY);
  if (payload.type !== 'refresh') throw new Error('Tipo de token inválido');
  return payload;
}

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = { firmarAcceso, firmarRefresh, verificarAcceso, verificarRefresh, hashToken };
