// Error "operacional": se puede mostrar su mensaje al usuario
class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.isOperational = true;
  }
}
module.exports = AppError;
