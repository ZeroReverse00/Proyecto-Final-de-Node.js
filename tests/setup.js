// Variables de entorno para tests (se ejecuta antes de cargar la app)
const os = require('os');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-de-pruebas-secreto-de-pruebas-123456';
process.env.BCRYPT_ROUNDS = '4';
process.env.UPLOAD_DIR = path.join(os.tmpdir(), 'recetario-test-uploads');
