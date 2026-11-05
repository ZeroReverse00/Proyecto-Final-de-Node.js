// Autenticación: identifica al usuario por JWT en cookie y renueva la sesión con el refresh token
const User = require('../models/User');
const tokenService = require('../services/tokenService');
const authService = require('../services/authService');
const AppError = require('../utils/AppError');
const { setAuthCookies, clearAuthCookies } = require('../utils/cookies');

const wantsJson = (req) => req.xhr || req.accepts(['html', 'json']) === 'json';

// Se ejecuta en TODAS las peticiones: define req.user (o null) y res.locals.currentUser para las vistas
async function attachUser(req, res, next) {
  req.user = null;
  res.locals.currentUser = null;
  try {
    const { accessToken, refreshToken } = req.cookies || {};
    let user = null;

    if (accessToken) {
      try {
        const payload = tokenService.verificarAcceso(accessToken);
        user = await User.findById(payload.sub);
      } catch {
        /* expirado o inválido: se intenta con el refresh token */
      }
    }

    if (!user && refreshToken) {
      try {
        const sesion = await authService.refrescar(refreshToken);
        setAuthCookies(res, sesion.tokens);
        req.sessionRefreshed = true;
        user = sesion.user;
      } catch {
        clearAuthCookies(res);
      }
    }

    if (user) {
      req.user = user;
      res.locals.currentUser = user;
    }
    next();
  } catch (err) {
    next(err);
  }
}

// Protege rutas privadas
function requireAuth(req, res, next) {
  if (req.user) return next();
  if (wantsJson(req)) return next(new AppError('Debes iniciar sesión', 401));
  req.flash('warning', 'Inicia sesión para continuar');
  res.redirect('/auth/login');
}

// Para login/registro: si ya hay sesión, no tiene sentido mostrarlos
function guestOnly(req, res, next) {
  if (req.user) return res.redirect('/recetas');
  next();
}

module.exports = { attachUser, requireAuth, guestOnly };
