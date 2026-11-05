// Crea (o promueve) un usuario admin.
// Uso: ADMIN_EMAIL=admin@correo.com ADMIN_PASSWORD='ClaveSegura123' npm run seed:admin
const config = require('../config');
const { connectDB, disconnectDB } = require('../config/database');
const User = require('../models/User');

(async () => {
  try {
    config.assert();
    const email = (process.env.ADMIN_EMAIL || '').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || '';
    const nombre = process.env.ADMIN_NAME || 'Administrador';
    if (!email || password.length < 8) {
      throw new Error('Define ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 8 caracteres)');
    }
    await connectDB();
    const existente = await User.findOne({ email });
    if (existente) {
      existente.role = 'admin';
      await existente.save();
      console.log(`Usuario existente promovido a admin: ${email}`);
    } else {
      await User.create({ nombre, email, password, role: 'admin' });
      console.log(`Admin creado: ${email}`);
    }
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
})();
