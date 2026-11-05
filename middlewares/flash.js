// Mensajes flash sin sesión de servidor: cookie corta httpOnly que se lee y se borra en la siguiente petición
const config = require('../config');

module.exports = function flash(req, res, next) {
  let recibidos = [];
  if (req.cookies && req.cookies.flash) {
    try {
      const parsed = JSON.parse(req.cookies.flash);
      if (Array.isArray(parsed)) recibidos = parsed.slice(0, 5);
    } catch {
      /* cookie manipulada: se ignora */
    }
    res.clearCookie('flash', { path: '/' });
  }
  res.locals.flash = recibidos;

  const pendientes = [];
  // req.flash('success', 'Texto') -> se mostrará tras la redirección
  req.flash = (type, message) => {
    pendientes.push({ type, message });
    res.cookie('flash', JSON.stringify(pendientes), {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.https,
      maxAge: 60 * 1000,
      path: '/',
    });
  };
  next();
};
