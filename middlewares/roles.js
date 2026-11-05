// Autorización: por rol y por propiedad del recurso
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const recetaService = require('../services/recetaService');

// Autorización por rol: authorizeRoles('user', 'admin')
const authorizeRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(new AppError('Debes iniciar sesión', 401));
    if (!roles.includes(req.user.role)) return next(new AppError('No tienes permisos para esta acción', 403));
    next();
  };

// Carga la receta de :id en req.receta (404 si no existe)
const cargarReceta = asyncHandler(async (req, res, next) => {
  req.receta = await recetaService.obtener(req.params.id);
  next();
});

// Editar: solo el autor
const soloPropietario = (req, res, next) =>
  recetaService.permisos(req.user, req.receta).puedeEditar
    ? next()
    : next(new AppError('Solo el autor puede editar esta receta', 403));

// Eliminar: el autor o un admin
const propietarioOAdmin = (req, res, next) =>
  recetaService.permisos(req.user, req.receta).puedeEliminar
    ? next()
    : next(new AppError('No tienes permiso para eliminar esta receta', 403));

module.exports = { authorizeRoles, cargarReceta, soloPropietario, propietarioOAdmin };
