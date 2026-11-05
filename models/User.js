const { Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');
const config = require('../config');

const userSchema = new Schema(
  {
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: [true, 'El email es obligatorio'], unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    // Hash (SHA-256) del refresh token vigente: permite rotarlo y revocarlo
    refreshTokenHash: { type: String, default: null, select: false },
  },
  { timestamps: true }
);

// La validación corre antes de este hook, así que se valida la contraseña en claro y luego se hashea
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, config.bcryptRounds);
});

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokenHash;
  return obj;
};

// Hash de relleno para que el tiempo de respuesta no revele si el email existe
const DUMMY_HASH = bcrypt.hashSync('relleno-anti-timing', config.bcryptRounds);

userSchema.statics.buscarPorCredenciales = async function (email, password) {
  const user = await this.findOne({ email: String(email).toLowerCase() }).select('+password');
  const ok = await bcrypt.compare(String(password), user ? user.password : DUMMY_HASH);
  return user && ok ? user : null;
};

module.exports = model('User', userSchema);
