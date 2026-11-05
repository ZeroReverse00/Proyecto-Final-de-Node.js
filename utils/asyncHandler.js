// Envuelve handlers async para enviar los errores al middleware global
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
