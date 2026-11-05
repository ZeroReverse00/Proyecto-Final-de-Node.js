const fs = require('fs/promises');
const path = require('path');
const config = require('../config');

// Borra una imagen subida (ignora errores si no existe). basename evita path traversal.
async function eliminarArchivo(nombre) {
  if (!nombre) return;
  await fs.unlink(path.join(config.uploadDir, path.basename(nombre))).catch(() => {});
}

module.exports = { eliminarArchivo };
