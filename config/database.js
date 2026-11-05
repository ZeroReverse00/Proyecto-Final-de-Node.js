// Conexión a MongoDB (Atlas) con Mongoose
const mongoose = require('mongoose');
const config = require('./index');

async function connectDB(uri = config.databaseUrl) {
  if (!uri) throw new Error('DATABASE_URL no está definida');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`MongoDB conectado: ${mongoose.connection.name}`);
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
