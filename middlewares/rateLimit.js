const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');

const base = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (req, res, next) => next(new AppError('Demasiadas solicitudes. Inténtalo de nuevo más tarde.', 429)),
};

// Límite general por IP
const generalLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 300 });
// Límite estricto para login/registro (fuerza bruta)
const authLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 20 });

module.exports = { generalLimiter, authLimiter };
