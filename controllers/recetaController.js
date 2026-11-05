const recetaService = require('../services/recetaService');
const asyncHandler = require('../utils/asyncHandler');

exports.index = asyncHandler(async (req, res) => {
  const resultado = await recetaService.listar(req.query, req.user);
  res.render('recetas/index', { title: 'Recetas', ...resultado });
});

exports.show = (req, res) => {
  res.render('recetas/show', {
    title: req.receta.titulo,
    receta: req.receta,
    ...recetaService.permisos(req.user, req.receta),
  });
};

exports.nueva = (req, res) => res.render('recetas/new', { title: 'Nueva receta' });

exports.crear = asyncHandler(async (req, res) => {
  const receta = await recetaService.crear(req.body, req.user._id, req.file);
  req.flash('success', 'Receta creada correctamente');
  res.redirect(`/recetas/${receta._id}`);
});

exports.editar = (req, res) => res.render('recetas/edit', { title: 'Editar receta', receta: req.receta });

exports.actualizar = asyncHandler(async (req, res) => {
  await recetaService.actualizar(req.receta, req.body, req.file);
  req.flash('success', 'Receta actualizada');
  res.redirect(`/recetas/${req.receta._id}`);
});

exports.eliminar = asyncHandler(async (req, res) => {
  await recetaService.eliminar(req.receta);
  req.flash('success', 'Receta eliminada');
  res.redirect('/recetas');
});
