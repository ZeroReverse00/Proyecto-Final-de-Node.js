# Checklist de requisitos

## Obligatorios

| # | Requisito | Estado | Dónde |
|---|---|---|---|
| 1 | Carpetas /config, /controllers, /middlewares, /models, /routes, /views, /public | ✅ | estructura raíz |
| 1 | Sin lógica de negocio en controladores ni consultas en rutas | ✅ | `services/`, `models/Receta.js` (`paginar`), `controllers/*` |
| 2 | CRUD completo (listado + detalle + crear + editar + eliminar) | ✅ | `routes/recetas.js`, `controllers/recetaController.js`, `services/recetaService.js` |
| 2 | Conexión real a MongoDB Atlas con Mongoose | ✅ | `config/database.js` |
| 2 | Validación con express-validator | ✅ | `middlewares/validators.js` |
| 3 | Registro y login | ✅ | `routes/auth.js`, `services/authService.js` |
| 3 | bcrypt con salt rounds ≥ 10 | ✅ | `models/User.js`, `config/index.js` (mínimo forzado 10) |
| 3 | JWT con expiración (generación y verificación) | ✅ | `services/tokenService.js` |
| 3 | Middleware de protección de rutas privadas | ✅ | `middlewares/auth.js` (`requireAuth`) |
| 3 | Roles `user` y `admin` | ✅ | `models/User.js`, `scripts/createAdmin.js` |
| 3 | Autorización por rol y por propiedad | ✅ | `middlewares/roles.js`, `services/recetaService.js` (`permisos`) |
| 4 | Layout base + partials (header, footer, flash) | ✅ | `views/layouts/main.ejs`, `views/partials/` |
| 4 | Vistas: listado, crear, editar, detalle, login, registro, error | ✅ | `views/recetas/*`, `views/auth/*`, `views/error.ejs` |
| 4 | Mensajes flash | ✅ | `middlewares/flash.js` (equivalente a connect-flash, sin sesión de servidor) |
| 4 | Errores visibles al usuario | ✅ | `partials/flash.ejs`, `middlewares/errorHandler.js` |
| 5 | Variables DATABASE_URL, JWT_SECRET, NODE_ENV, PORT | ✅ | `config/index.js`, `.env.example` |
| 5 | `.env.example` y `.gitignore` (node_modules, .env) | ✅ | raíz |
| 5 | Scripts `start` y `dev` | ✅ | `package.json` |
| 5 | README con despliegue en Render + HTTPS | ✅ | `README.md`, `render.yaml` |

## Opcionales

| Requisito | Estado | Dónde |
|---|---|---|
| Paginación `?page=&limit=` | ✅ | `services/recetaService.js`, `views/recetas/index.ejs` |
| Búsqueda y filtros (título, categoría, "mías") | ✅ | `services/recetaService.js` |
| Subida de imágenes con multer | ✅ | `middlewares/upload.js` |
| Manejo global de errores | ✅ | `middlewares/errorHandler.js` |
| Tests Jest + supertest (auth y CRUD) | ✅ | `tests/auth.test.js`, `tests/recetas.test.js` |
| Docker + docker-compose con MongoDB | ✅ | `Dockerfile`, `docker-compose.yml` |
| Bootstrap por CDN | ✅ | `views/layouts/main.ejs` |
| Refresh tokens (flujo documentado) | ✅ | `services/authService.js`, `middlewares/auth.js`, README |
| Seguridad: Helmet, rate limit, sanitización, CORS, cookies httpOnly | ✅ | `app.js`, `middlewares/rateLimit.js`, `utils/cookies.js` |
