// Base de datos de pruebas: MongoDB en memoria, o TEST_DATABASE_URL si se define
// (¡usa una base DEDICADA a tests: se vacía entre pruebas!)
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

exports.conectar = async () => {
  let uri = process.env.TEST_DATABASE_URL;
  if (!uri) {
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
  }
  await mongoose.connect(uri);
};

exports.limpiar = async () => {
  for (const coleccion of Object.values(mongoose.connection.collections)) {
    await coleccion.deleteMany({});
  }
};

exports.desconectar = async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
};
