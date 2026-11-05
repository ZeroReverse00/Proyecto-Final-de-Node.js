// Punto de entrada. Exporta `app` (para los tests) y arranca el servidor solo si se ejecuta directamente.
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');

const config = require('./config');
const { connectDB } = require('./config/database');
const flash = require('./middlewares/flash');
const sameOrigin = require('./middlewares/sameOrigin');
const { attachUser } = require('./middlewares/auth');
const { generalLimiter } = require('./middlewares/rateLimit');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();
const CDN = 'https://cdn.jsdelivr.net';

app.set('trust proxy', 1); // Render está detrás de un proxy: necesario para IP real y cookies secure
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Cabeceras de seguridad (CSP permite solo nuestro origen y Bootstrap desde jsDelivr)
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'script-src': ["'self'", CDN],
        'style-src': ["'self'", CDN],
        'img-src': ["'self'", 'data:'],
        'font-src': ["'self'", CDN],
        'upgrade-insecure-requests': config.https ? [] : null,
      },
    },
    hsts: config.https,
    referrerPolicy: { policy: 'same-origin' },
  })
);
if (config.corsOrigins.length) app.use(cors({ origin: config.corsOrigins, credentials: true }));
if (config.env !== 'test') app.use(morgan(config.isProd ? 'combined' : 'dev'));

// Estáticos y health check (antes del rate limit y de la autenticación)
app.use(express.static(path.join(__dirname, 'public'), { maxAge: config.isProd ? '7d' : 0 }));
app.use('/uploads', express.static(config.uploadDir));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(generalLimiter);
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // elimina operadores $ y . de body/query/params (NoSQL injection)
app.use(methodOverride('_method')); // <form action="/recetas/1?_method=PUT" method="POST">
app.use(sameOrigin);
app.use(flash);
app.use(attachUser);
app.use((req, res, next) => {
  res.locals.title = 'Recetario';
  res.locals.currentPath = req.path;
  next();
});

app.get('/', (req, res) => res.redirect('/recetas'));
app.use('/auth', require('./routes/auth'));
app.use('/recetas', require('./routes/recetas'));

app.use(notFound);
app.use(errorHandler);

async function start() {
  config.assert();
  await connectDB();
  const server = app.listen(config.port, () => console.log(`Servidor en puerto ${config.port} (${config.env})`));
  const apagar = () => server.close(() => process.exit(0));
  process.on('SIGTERM', apagar);
  process.on('SIGINT', apagar);
}

if (require.main === module) {
  start().catch((err) => {
    console.error('No se pudo iniciar la aplicación:', err.message);
    process.exit(1);
  });
}

module.exports = app;
