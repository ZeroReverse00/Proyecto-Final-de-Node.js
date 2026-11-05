# 🍳 Recetario

Aplicación web para publicar y gestionar recetas de cocina, construida con **Node.js 24, Express, MongoDB Atlas y EJS**, con autenticación JWT y roles (`user` / `admin`). Proyecto final con arquitectura MVC, lista para desplegar en Render.com.

🔗 **Producción:** https://tu-app.onrender.com

> 📸 _Espacio para captura de pantalla o video demostrativo._

## Funcionalidades

- Registro, login y logout con JWT guardado en cookies `httpOnly`; refresh token rotatorio.
- CRUD completo de recetas (listado, detalle, crear, editar, eliminar) con validación.
- Roles: `user` (crea y edita sus recetas, elimina las suyas) y `admin` (además puede eliminar cualquier receta).
- Catálogo de lectura pública; las escrituras requieren sesión.
- Paginación (`?page=2&limit=10`), búsqueda por título y filtro por categoría ("solo mías" para usuarios).
- Subida de imágenes (JPG/PNG/WEBP, máx. 2 MB) con multer.
- Mensajes flash, vistas de error, manejo global de errores.
- Seguridad: Helmet + CSP, rate limiting, sanitización NoSQL, comprobación de origen (CSRF), bcrypt.
- Tests con Jest + supertest, Docker y docker-compose.

## Tecnologías

Node.js 24 · Express 4 · MongoDB Atlas + Mongoose · EJS + express-ejs-layouts · Bootstrap 5 (CDN) · JWT (jsonwebtoken) · bcrypt · Helmet · express-validator · express-rate-limit · express-mongo-sanitize · multer · method-override · dotenv · Jest · supertest · Docker.

## Instalación local

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.example .env
#    Edita .env: DATABASE_URL (Atlas o mongodb://localhost:27017/recetario) y JWT_SECRET
#    Genera un secreto:  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 3. Arranca en modo desarrollo
npm run dev          # http://localhost:3000

# 4. (Opcional) crea un administrador
ADMIN_EMAIL=admin@correo.com ADMIN_PASSWORD='UnaClaveSegura123' npm run seed:admin

# 5. Tests
npm test
```

> Los tests usan MongoDB en memoria (`mongodb-memory-server`, descarga un binario la primera vez). Si prefieres una base real define `TEST_DATABASE_URL` apuntando a una base **dedicada a tests**: se vacía entre pruebas.

### Con Docker

```bash
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")" > .env
docker compose up --build        # app en http://localhost:3000, MongoDB incluido
```

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí | Cadena de conexión de MongoDB |
| `JWT_SECRET` | Sí | Secreto para firmar JWT (≥ 32 caracteres en producción) |
| `NODE_ENV` | Sí en prod. | `production` activa cookies `secure`, HSTS y oculta detalles de errores |
| `PORT` | No | Puerto (Render lo inyecta; por defecto 3000) |
| `JWT_REFRESH_SECRET` | No | Secreto propio para refresh tokens (si no, se deriva de `JWT_SECRET`) |
| `JWT_EXPIRES_IN` | No | Vida del token de acceso (por defecto `15m`) |
| `JWT_REFRESH_DAYS` | No | Vida del refresh token en días (por defecto `7`) |
| `BCRYPT_ROUNDS` | No | Rondas de bcrypt (por defecto 12; mínimo forzado: 10) |
| `CORS_ORIGIN` | No | Orígenes permitidos separados por comas (por defecto, solo mismo origen) |
| `COOKIE_SECURE` | No | `false` solo para probar `NODE_ENV=production` en `http://localhost` |
| `UPLOAD_DIR` | No | Carpeta de imágenes (útil con un disco persistente) |

## MongoDB Atlas

1. Crea una cuenta en <https://cloud.mongodb.com> y un cluster gratuito (M0).
2. **Database Access** → _Add New Database User_ (usuario + contraseña; guarda ambos).
3. **Network Access** → _Add IP Address_ → `0.0.0.0/0` (necesario en Render free, que no tiene IP fija; la protección es la contraseña del usuario).
4. **Database** → _Connect_ → _Drivers_ → copia la cadena `mongodb+srv://...` y añade el nombre de la base antes del `?`: `.../recetario?retryWrites=true&w=majority`.
5. Pégala en `DATABASE_URL`. Las colecciones se crean solas al usar la app.

## Despliegue en Render.com

1. Sube el proyecto a GitHub (`.env` y `node_modules` están en `.gitignore`).
2. En Render: **New +** → **Web Service** → conecta el repositorio.
3. Configura:
   - **Runtime:** Node · **Build Command:** `npm install --omit=dev` · **Start Command:** `npm start`
   - **Health Check Path:** `/health`
4. **Environment** → añade: `NODE_VERSION=24`, `NODE_ENV=production`, `DATABASE_URL` (Atlas) y `JWT_SECRET` (≥ 32 caracteres aleatorios).
5. **Create Web Service**. Render te da una URL `https://<nombre>.onrender.com` con **HTTPS automático** (certificado gestionado por Render; la app ya confía en el proxy con `trust proxy`).
6. Crear el admin en producción: pestaña **Shell** del servicio (o ejecútalo en local apuntando `DATABASE_URL` a Atlas):
   ```bash
   ADMIN_EMAIL=admin@correo.com ADMIN_PASSWORD='UnaClaveSegura123' npm run seed:admin
   ```

También puedes usar el blueprint `render.yaml` (_New + → Blueprint_).

> ⚠️ **Imágenes en Render:** el disco del plan gratuito es efímero (se pierde en cada deploy). Para producción real, monta un _Render Disk_ y define `UPLOAD_DIR=/ruta/del/disco`, o migra las subidas a Cloudinary/S3.

## Autenticación: flujo de tokens

1. **Login/registro** → el servidor emite un **access token** (JWT, 15 min) y un **refresh token** (JWT, 7 días) en cookies `httpOnly`, `SameSite=Lax` y `Secure` en producción.
2. Del refresh token solo se guarda en la base su **hash SHA-256** (`User.refreshTokenHash`).
3. En cada petición, `attachUser` valida el access token. Si expiró, usa el refresh token: lo verifica, lo compara con el hash guardado y **rota** ambos tokens.
4. Si llega un refresh token que ya no es el vigente (reutilización), se **revoca la sesión** y hay que volver a iniciar sesión.
5. **Logout** borra el hash en la base y las cookies. `POST /auth/refresh` permite la renovación explícita desde clientes JSON.

## Estructura del proyecto

```
proyecto-final/
├── app.js                  # Configuración de Express (exporta app; arranca si se ejecuta directo)
├── config/                 # index.js (variables de entorno), database.js (Mongoose)
├── controllers/            # authController, recetaController (solo HTTP ↔ servicios)
├── services/               # authService, recetaService, tokenService (lógica de negocio)
├── models/                 # User, Receta (esquemas, consultas y reglas de datos)
├── middlewares/            # auth, roles, validators, upload, flash, rateLimit, sameOrigin, errorHandler
├── routes/                 # auth.js, recetas.js (solo cableado de middlewares y controladores)
├── utils/                  # AppError, asyncHandler, cookies, files
├── views/                  # layouts/, partials/, recetas/, auth/, error.ejs
├── public/                 # css/, js/, uploads/
├── scripts/createAdmin.js  # Crear/promover admin
├── tests/                  # Jest + supertest
├── Dockerfile · docker-compose.yml · render.yaml
└── .env.example · .gitignore · package.json
```

## Notas de seguridad

- **Helmet** con CSP restrictiva (solo recursos propios y Bootstrap desde jsDelivr), HSTS en producción.
- **Rate limiting:** 300 peticiones/15 min por IP en general; 20/15 min en login, registro y refresh.
- **Sanitización:** `express-mongo-sanitize` elimina operadores `$`/`.`; express-validator valida y normaliza; EJS escapa la salida (`<%= %>`) y no hay JS inline.
- **Contraseñas:** bcrypt con ≥ 10 rondas; comparación con hash de relleno para no revelar si el email existe.
- **Cookies** `httpOnly` + `SameSite=Lax` + `Secure` en producción, y comprobación de cabecera `Origin` en peticiones que modifican datos (defensa CSRF adicional). Para un modelo de amenazas más exigente, añade tokens CSRF.
- **CORS** deshabilitado por defecto (misma origen); se habilita con `CORS_ORIGIN`.
- **Subidas:** nombre generado por el servidor, tipo y tamaño limitados.
- **Roles:** el rol nunca se acepta desde formularios; el admin se crea solo con el script.
- Los errores 500 no revelan detalles en producción.
- Pendiente recomendable: añadir SRI a los `<link>/<script>` de Bootstrap y rotar `JWT_SECRET` periódicamente.

## Decisiones de diseño

- **Recurso:** "Recetas" (relación 1:N con usuarios, imágenes, categorías y búsqueda aportan casos reales).
- **MongoDB + Mongoose:** preferido por el enunciado y encaja con documentos anidados (ingredientes).
- **Capa de servicios:** añadida a la estructura pedida para que controladores y rutas no contengan lógica de negocio.
- **JWT en cookies httpOnly** (en lugar de `localStorage`): con vistas EJS renderizadas en servidor es lo más seguro frente a XSS.
- **Permisos:** lectura pública; editar solo el autor; eliminar autor o admin (el enunciado define al admin como "ver/borrar todo").
- **Express 4:** ecosistema de middlewares más estable (`express-mongo-sanitize`, `express-ejs-layouts`).
