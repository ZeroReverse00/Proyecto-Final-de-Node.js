// Defensa CSRF adicional a SameSite=Lax: las peticiones que modifican datos y traen cabecera Origin
// deben venir del mismo host. (Peticiones sin Origin, como curl o tests, no son ataques de navegador.)
const AppError = require('../utils/AppError');

module.exports = function sameOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (!origin) return next();
  try {
    if (new URL(origin).host === req.get('host')) return next();
  } catch {
    /* origen malformado */
  }
  next(new AppError('Origen de la petición no permitido', 403));
};
