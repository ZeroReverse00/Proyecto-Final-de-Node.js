// Defensa CSRF adicional a SameSite=Lax: las peticiones que modifican datos y traen cabecera Origin
// deben venir del mismo host (también se acepta el host reenviado por el proxy de Render).
const AppError = require('../utils/AppError');

module.exports = function sameOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (!origin) return next();
  try {
    const originHost = new URL(origin).host;
    const hosts = [req.get('host'), req.get('x-forwarded-host')]
      .filter(Boolean)
      .flatMap((h) => h.split(','))
      .map((h) => h.trim());
    if (hosts.includes(originHost)) return next();
  } catch {
    /* origen malformado */
  }
  next(new AppError('Origen de la petición no permitido', 403));
};
