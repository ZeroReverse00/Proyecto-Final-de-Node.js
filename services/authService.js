// Lógica de negocio de autenticación
const crypto = require('crypto');
const User = require('../models/User');
const tokenService = require('./tokenService');
const AppError = require('../utils/AppError');

// Crea el par de tokens y guarda el hash del refresh token vigente (rotación)
async function emitirSesion(user) {
  const tokens = {
    accessToken: tokenService.firmarAcceso(user),
    refreshToken: tokenService.firmarRefresh(user),
  };
  await User.updateOne({ _id: user._id }, { $set: { refreshTokenHash: tokenService.hashToken(tokens.refreshToken) } });
  return { user, tokens };
}

async function registrar({ nombre, email, password }) {
  if (await User.exists({ email: String(email).toLowerCase() })) {
    throw new AppError('Ya existe una cuenta con ese email', 409);
  }
  // El rol NUNCA viene del formulario: siempre "user"
  const user = await User.create({ nombre, email, password, role: 'user' });
  return emitirSesion(user);
}

async function iniciarSesion({ email, password }) {
  const user = await User.buscarPorCredenciales(email, password);
  if (!user) throw new AppError('Email o contraseña incorrectos', 401);
  return emitirSesion(user);
}

// Rota el refresh token. Si llega uno que ya no es el vigente (posible robo/reutilización),
// se revoca la sesión completa.
async function refrescar(refreshToken) {
  let payload;
  try {
    payload = tokenService.verificarRefresh(refreshToken);
  } catch {
    throw new AppError('Sesión expirada', 401);
  }
  const user = await User.findById(payload.sub).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash) throw new AppError('Sesión expirada', 401);

  const guardado = Buffer.from(user.refreshTokenHash);
  const recibido = Buffer.from(tokenService.hashToken(refreshToken));
  if (guardado.length !== recibido.length || !crypto.timingSafeEqual(guardado, recibido)) {
    await User.updateOne({ _id: user._id }, { $set: { refreshTokenHash: null } });
    throw new AppError('Sesión inválida', 401);
  }
  return emitirSesion(user);
}

async function cerrarSesion(userId) {
  await User.updateOne({ _id: userId }, { $set: { refreshTokenHash: null } });
}

module.exports = { registrar, iniciarSesion, refrescar, cerrarSesion };
