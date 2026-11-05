// Manejo global de errores
const multer = require('multer');
const config = require('../config');
const AppError = require('../utils/AppError');

function notFound(req, res, next) {
  next(new AppError('Página no encontrada', 404));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message;

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    status = 404;
    message = 'Recurso no encontrado';
  } else if (err.code === 11000) {
    status = 409;
    message = 'Ya existe un registro con esos datos';
  } else if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'La imagen supera el máximo de 2 MB' : 'Error al subir el archivo';
  }

  if (status >= 500) {
    console.error(err);
    if (config.isProd) message = 'Error interno del servidor'; // no filtrar detalles
  }

  if (res.headersSent) return next(err);

  if (req.xhr || req.accepts(['html', 'json']) === 'json') {
    return res.status(status).json({ error: message });
  }
  res.status(status).render('error', {
    title: `Error ${status}`,
    status,
    message,
    stack: config.isProd ? null : err.stack,
  });
}

module.exports = { notFound, errorHandler };
