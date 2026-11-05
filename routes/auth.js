const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { requireAuth, guestOnly } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimit');
const { registerRules, loginRules, validate } = require('../middlewares/validators');

router.get('/register', guestOnly, ctrl.mostrarRegistro);
router.post('/register', authLimiter, guestOnly, registerRules, validate('auth/register', 'Crear cuenta'), ctrl.registrar);

router.get('/login', guestOnly, ctrl.mostrarLogin);
router.post('/login', authLimiter, guestOnly, loginRules, validate('auth/login', 'Iniciar sesión'), ctrl.login);

router.post('/logout', ctrl.logout);
router.post('/refresh', authLimiter, ctrl.refresh);

module.exports = router;
