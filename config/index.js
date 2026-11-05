// Configuración centralizada a partir de variables de entorno
const path = require('path');
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
const isProd = env === 'production';

// En producción las cookies son "secure" (solo HTTPS). Render termina TLS y reenvía por proxy.
// COOKIE_SECURE=false permite probar la imagen de producción en http://localhost (docker-compose).
const https = process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProd;

// bcrypt: nunca menos de 10 rondas (salvo en tests, para que sean rápidos)
const rondas = Number(process.env.BCRYPT_ROUNDS) || 12;

const config = {
  env,
  isProd,
  https,
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    accessSecret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET}:refresh`,
    accessExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshDays: Number(process.env.JWT_REFRESH_DAYS) || 7,
  },
  bcryptRounds: env === 'test' ? rondas : Math.max(10, rondas),
  uploadDir: path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '..', 'public', 'uploads')),
  corsOrigins: (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean),
};

// Falla rápido al arrancar si falta algo crítico
config.assert = () => {
  const faltan = ['DATABASE_URL', 'JWT_SECRET'].filter((k) => !process.env[k]);
  if (faltan.length) throw new Error(`Faltan variables de entorno: ${faltan.join(', ')}`);
  if (isProd && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres en producción');
  }
};

module.exports = config;
