// Lógica de negocio de recetas: filtros, paginación, permisos y manejo de imágenes
const mongoose = require('mongoose');
const Receta = require('../models/Receta');
const AppError = require('../utils/AppError');
const { eliminarArchivo } = require('../utils/files');

const CAMPOS = ['titulo', 'descripcion', 'ingredientes', 'instrucciones', 'categoria', 'tiempoPreparacion'];
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pick = (obj) => Object.fromEntries(CAMPOS.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

async function listar(query, usuario) {
  const q = typeof query.q === 'string' ? query.q.trim().slice(0, 100) : '';
  const categoria = Receta.CATEGORIAS.includes(query.categoria) ? query.categoria : '';
  const mias = Boolean(usuario) && query.mias === '1';
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 9));

  const filtro = {};
  if (q) filtro.titulo = { $regex: escapeRegex(q), $options: 'i' };
  if (categoria) filtro.categoria = categoria;
  if (mias) filtro.autor = usuario._id;

  const resultado = await Receta.paginar(filtro, { page, limit });
  return { ...resultado, filtros: { q, categoria, mias } };
}

async function obtener(id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError('Receta no encontrada', 404);
  const receta = await Receta.findById(id).populate('autor', 'nombre');
  if (!receta) throw new AppError('Receta no encontrada', 404);
  return receta;
}

// Reglas de autorización por propiedad: editar = solo el autor; eliminar = autor o admin
function permisos(usuario, receta) {
  const propietario = Boolean(usuario) && receta.esPropietario(usuario._id);
  return {
    puedeEditar: propietario,
    puedeEliminar: propietario || (Boolean(usuario) && usuario.role === 'admin'),
  };
}

async function crear(datos, autorId, archivo) {
  return Receta.create({ ...pick(datos), autor: autorId, imagen: archivo ? archivo.filename : null });
}

async function actualizar(receta, datos, archivo) {
  receta.set(pick(datos));
  if (archivo) {
    await eliminarArchivo(receta.imagen);
    receta.imagen = archivo.filename;
  }
  try {
    return await receta.save();
  } catch (err) {
    if (archivo) await eliminarArchivo(archivo.filename); // no dejar huérfana la nueva imagen
    throw err;
  }
}

async function eliminar(receta) {
  await receta.deleteOne();
  await eliminarArchivo(receta.imagen);
}

module.exports = { listar, obtener, permisos, crear, actualizar, eliminar, CATEGORIAS: Receta.CATEGORIAS };
