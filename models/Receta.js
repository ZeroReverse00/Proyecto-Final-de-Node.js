const { Schema, model } = require('mongoose');

const CATEGORIAS = ['Entrada', 'Plato principal', 'Sopa', 'Ensalada', 'Postre', 'Bebida', 'Snack', 'Otro'];

const recetaSchema = new Schema(
  {
    titulo: { type: String, required: [true, 'El título es obligatorio'], trim: true, minlength: 3, maxlength: 120 },
    descripcion: { type: String, trim: true, maxlength: 500, default: '' },
    ingredientes: {
      type: [String],
      validate: [(v) => v.length >= 1 && v.length <= 50, 'Debe haber entre 1 y 50 ingredientes'],
    },
    instrucciones: { type: String, required: true, trim: true, minlength: 10, maxlength: 5000 },
    categoria: { type: String, enum: CATEGORIAS, default: 'Otro', index: true },
    tiempoPreparacion: { type: Number, min: 1, max: 1440, required: true }, // minutos
    imagen: { type: String, default: null }, // nombre de archivo en /uploads
    autor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

recetaSchema.index({ titulo: 1 });

// ¿El usuario es el autor? Funciona con "autor" poblado o sin poblar
recetaSchema.methods.esPropietario = function (userId) {
  const autorId = this.autor && this.autor._id ? this.autor._id : this.autor;
  return String(autorId) === String(userId);
};

// Consulta paginada (la consulta vive en el modelo, no en rutas ni controladores)
recetaSchema.statics.paginar = async function (filtro, { page, limit }) {
  const [items, total] = await Promise.all([
    this.find(filtro)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('autor', 'nombre')
      .lean(),
    this.countDocuments(filtro),
  ]);
  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
};

const Receta = model('Receta', recetaSchema);
Receta.CATEGORIAS = CATEGORIAS;
module.exports = Receta;
