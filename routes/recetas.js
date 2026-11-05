const router = require('express').Router();
const ctrl = require('../controllers/recetaController');
const { requireAuth } = require('../middlewares/auth');
const { authorizeRoles, cargarReceta, soloPropietario, propietarioOAdmin } = require('../middlewares/roles');
const upload = require('../middlewares/upload');
const { recetaRules, validate } = require('../middlewares/validators');
const { CATEGORIAS } = require('../services/recetaService');

// Categorías disponibles para los formularios y filtros
router.use((req, res, next) => {
  res.locals.categorias = CATEGORIAS;
  next();
});

const escritura = [requireAuth, authorizeRoles('user', 'admin')];

// Lectura pública
router.get('/', ctrl.index);

// "/nueva" debe ir antes de "/:id"
router.get('/nueva', ...escritura, ctrl.nueva);
router.post('/', ...escritura, upload, recetaRules, validate('recetas/new', 'Nueva receta'), ctrl.crear);

router.get('/:id', cargarReceta, ctrl.show);

// Edición: solo el autor. El orden importa: auth -> cargar -> propiedad -> upload -> validar
router.get('/:id/editar', ...escritura, cargarReceta, soloPropietario, ctrl.editar);
router.put('/:id', ...escritura, cargarReceta, soloPropietario, upload, recetaRules, validate('recetas/edit', 'Editar receta'), ctrl.actualizar);

// Eliminación: autor o admin
router.delete('/:id', ...escritura, cargarReceta, propietarioOAdmin, ctrl.eliminar);

module.exports = router;
