// Reglas de express-validator + middleware que re-renderiza el formulario con los errores.
// Nota: NO se usa .escape() porque EJS ya escapa al imprimir (<%= %>); escapar dos veces corrompe los datos.
const { body, validationResult } = require('express-validator');
const Receta = require('../models/Receta');
const { eliminarArchivo } = require('../utils/files');

const aLineas = (v) =>
  (Array.isArray(v) ? v : String(v ?? '').split(/\r?\n/))
    .map((s) => String(s).trim().slice(0, 200))
    .filter(Boolean);

const registerRules = [
  body('nombre').trim().isLength({ min: 2, max: 60 }).withMessage('El nombre debe tener entre 2 y 60 caracteres'),
  body('email').trim().isEmail().withMessage('Email inválido').normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .isLength({ min: 8, max: 72 }).withMessage('La contraseña debe tener entre 8 y 72 caracteres')
    .matches(/[A-Za-z]/).withMessage('La contraseña debe incluir al menos una letra')
    .matches(/\d/).withMessage('La contraseña debe incluir al menos un número'),
  body('confirmarPassword')
    .custom((v, { req }) => v === req.body.password)
    .withMessage('Las contraseñas no coinciden'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
];

const recetaRules = [
  body('titulo').trim().isLength({ min: 3, max: 120 }).withMessage('El título debe tener entre 3 y 120 caracteres'),
  body('descripcion').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('La descripción admite hasta 500 caracteres'),
  body('ingredientes')
    .customSanitizer(aLineas)
    .custom((arr) => arr.length >= 1 && arr.length <= 50)
    .withMessage('Agrega entre 1 y 50 ingredientes (uno por línea)'),
  body('instrucciones').trim().isLength({ min: 10, max: 5000 }).withMessage('Las instrucciones deben tener entre 10 y 5000 caracteres'),
  body('categoria').isIn(Receta.CATEGORIAS).withMessage('Categoría inválida'),
  body('tiempoPreparacion').isInt({ min: 1, max: 1440 }).withMessage('El tiempo debe estar entre 1 y 1440 minutos').toInt(),
];

// validate('auth/login', 'Iniciar sesión'): si hay errores, vuelve a mostrar la vista con 422
const validate = (vista, title) => async (req, res, next) => {
  const resultado = validationResult(req);
  if (resultado.isEmpty()) return next();
  if (req.file) await eliminarArchivo(req.file.filename); // la imagen subida no se usará
  const { password, confirmarPassword, ...old } = req.body; // nunca se devuelven contraseñas
  res.status(422).render(vista, {
    title,
    errors: resultado.array().map((e) => e.msg),
    old,
    receta: req.receta,
  });
};

module.exports = { registerRules, loginRules, recetaRules, validate };
