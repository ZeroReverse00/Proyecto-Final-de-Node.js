const request = require('supertest');
const app = require('../app');
const db = require('./db');
const User = require('../models/User');
const Receta = require('../models/Receta');

const receta = {
  titulo: 'Tortilla española',
  descripcion: 'Clásica',
  ingredientes: 'Huevos\nPapas\nCebolla',
  instrucciones: 'Fríe las papas, mézclalas con el huevo y cuaja la tortilla.',
  categoria: 'Plato principal',
  tiempoPreparacion: '40',
};

async function sesion(email, nombre = 'Usuario') {
  const agent = request.agent(app);
  await agent.post('/auth/register').type('form').send({ nombre, email, password: 'Clave1234', confirmarPassword: 'Clave1234' });
  return agent;
}
const idDe = (res) => res.headers.location.split('/').pop();

beforeAll(db.conectar);
afterEach(db.limpiar);
afterAll(db.desconectar);

describe('CRUD de recetas', () => {
  test('crea, lista, muestra, actualiza y elimina (autor)', async () => {
    const a = await sesion('a@test.com');

    const creada = await a.post('/recetas').type('form').send(receta);
    expect(creada.status).toBe(302);
    const id = idDe(creada);
    const guardada = await Receta.findById(id);
    expect(guardada.ingredientes).toEqual(['Huevos', 'Papas', 'Cebolla']);

    expect((await request(app).get('/recetas')).text).toContain('Tortilla española');
    expect((await request(app).get(`/recetas/${id}`)).status).toBe(200);

    const edit = await a.post(`/recetas/${id}?_method=PUT`).type('form').send({ ...receta, titulo: 'Tortilla de papas' });
    expect(edit.status).toBe(302);
    expect((await Receta.findById(id)).titulo).toBe('Tortilla de papas');

    const del = await a.post(`/recetas/${id}?_method=DELETE`);
    expect(del.status).toBe(302);
    expect(await Receta.findById(id)).toBeNull();
  });

  test('valida los datos (422) y no crea nada', async () => {
    const a = await sesion('a@test.com');
    const res = await a.post('/recetas').type('form').send({ ...receta, titulo: 'a', tiempoPreparacion: '0' });
    expect(res.status).toBe(422);
    expect(await Receta.countDocuments()).toBe(0);
  });

  test('un anónimo no puede crear', async () => {
    const res = await request(app).post('/recetas').type('form').send(receta);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  test('otro usuario no puede editar ni eliminar (403)', async () => {
    const a = await sesion('a@test.com');
    const b = await sesion('b@test.com', 'Otro');
    const id = idDe(await a.post('/recetas').type('form').send(receta));

    expect((await b.get(`/recetas/${id}/editar`)).status).toBe(403);
    expect((await b.post(`/recetas/${id}?_method=PUT`).type('form').send(receta)).status).toBe(403);
    expect((await b.post(`/recetas/${id}?_method=DELETE`)).status).toBe(403);
    expect(await Receta.findById(id)).not.toBeNull();
  });

  test('un admin puede eliminar recetas ajenas pero no editarlas', async () => {
    const a = await sesion('a@test.com');
    const id = idDe(await a.post('/recetas').type('form').send(receta));

    await User.create({ nombre: 'Admin', email: 'admin@test.com', password: 'Clave1234', role: 'admin' });
    const admin = request.agent(app);
    await admin.post('/auth/login').type('form').send({ email: 'admin@test.com', password: 'Clave1234' });

    expect((await admin.get(`/recetas/${id}/editar`)).status).toBe(403);
    expect((await admin.post(`/recetas/${id}?_method=DELETE`)).status).toBe(302);
    expect(await Receta.findById(id)).toBeNull();
  });

  test('paginación y búsqueda', async () => {
    const autor = await User.create({ nombre: 'X', email: 'x@test.com', password: 'Clave1234' });
    for (let i = 1; i <= 3; i++) {
      await Receta.create({
        ...receta, titulo: `Receta ${i}`, ingredientes: ['a'], tiempoPreparacion: 10,
        autor: autor._id, createdAt: new Date(2026, 0, i),
      });
    }
    const pagina2 = await request(app).get('/recetas?limit=2&page=2');
    expect(pagina2.text).toContain('Receta 1');
    expect(pagina2.text).not.toContain('Receta 3');

    const busqueda = await request(app).get('/recetas?q=receta 2');
    expect(busqueda.text).toContain('Receta 2');
    expect(busqueda.text).not.toContain('Receta 1');
  });

  test('un id inválido devuelve 404', async () => {
    expect((await request(app).get('/recetas/no-es-un-id')).status).toBe(404);
  });
});
