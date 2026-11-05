// Controladores de auth: solo traducen HTTP <-> servicio
const authService = require('../services/authService');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { setAuthCookies, clearAuthCookies } = require('../utils/cookies');

// Errores esperados (email repetido, credenciales malas) vuelven al formulario; el resto va al handler global
const reRenderSiEsperado = (vista, title, req, res, err) => {
  if (err instanceof AppError && err.status < 500) {
    const { password, confirmarPassword, ...old } = req.body;
    return res.status(err.status).render(vista, { title, errors: [err.message], old });
  }
  throw err;
};

exports.mostrarRegistro = (req, res) => res.render('auth/register', { title: 'Crear cuenta' });
exports.mostrarLogin = (req, res) => res.render('auth/login', { title: 'Iniciar sesión' });

exports.registrar = asyncHandler(async (req, res) => {
  try {
    const { user, tokens } = await authService.registrar(req.body);
    setAuthCookies(res, tokens);
    req.flash('success', `¡Bienvenido, ${user.nombre}!`);
    res.redirect('/recetas');
  } catch (err) {
    reRenderSiEsperado('auth/register', 'Crear cuenta', req, res, err);
  }
});

exports.login = asyncHandler(async (req, res) => {
  try {
    const { user, tokens } = await authService.iniciarSesion(req.body);
    setAuthCookies(res, tokens);
    req.flash('success', `Hola de nuevo, ${user.nombre}`);
    res.redirect('/recetas');
  } catch (err) {
    reRenderSiEsperado('auth/login', 'Iniciar sesión', req, res, err);
  }
});

exports.logout = asyncHandler(async (req, res) => {
  if (req.user) await authService.cerrarSesion(req.user._id);
  clearAuthCookies(res);
  req.flash('info', 'Sesión cerrada');
  res.redirect('/auth/login');
});

// Renovación explícita (para clientes JSON). En navegador, attachUser ya renueva solo.
exports.refresh = asyncHandler(async (req, res) => {
  if (req.sessionRefreshed) return res.json({ ok: true }); // ya se rotó en esta misma petición
  const sesion = await authService.refrescar(req.cookies.refreshToken || '');
  setAuthCookies(res, sesion.tokens);
  res.json({ ok: true });
});
