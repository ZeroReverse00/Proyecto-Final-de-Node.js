const request = require('supertest');
const app = require('../app');
const db = require('./db');
const User = require('../models/User');

const datos = { nombre: 'Ana', email: 'ana@test.com', password: 'Clave1234', confirmarPassword: 'Clave1234' };

beforeAll(db.conectar);
afterEach(db.limpiar);
afterAll(db.desconectar);

describe('Autenticación', () => {
  test('registra un usuario, hashea la contraseña y abre sesión con cookies httpOnly', async () => {
    const res = await request(app).post('/auth/register').type('form').send(datos);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/recetas');
    const cookies = res.headers['set-cookie'].join(';');
    expect(cookies).toMatch(/accessToken=/);
    expect(cookies).toMatch(/refreshToken=/);
    expect(cookies).toMatch(/HttpOnly/);

    const user = await User.findOne({ email: datos.email }).select('+password');
    expect(user.role).toBe('user');
    expect(user.password).not.toBe(datos.password);
    expect(user.password).toMatch(/^\$2[aby]\$/);
  });

  test('ignora un intento de asignarse el rol admin', async () => {
    await request(app).post('/auth/register').type('form').send({ ...datos, role: 'admin' });
    expect((await User.findOne({ email: datos.email })).role).toBe('user');
  });

  test('rechaza datos inválidos con 422', async () => {
    const res = await request(app).post('/auth/register').type('form').send({ ...datos, password: '123', confirmarPassword: '123' });
    expect(res.status).toBe(422);
    expect(res.text).toMatch(/contraseña/i);
  });

  test('rechaza un email duplicado con 409', async () => {
    await request(app).post('/auth/register').type('form').send(datos);
    const res = await request(app).post('/auth/register').type('form').send(datos);
    expect(res.status).toBe(409);
  });

  test('login correcto e incorrecto', async () => {
    await request(app).post('/auth/register').type('form').send(datos);
    const ok = await request(app).post('/auth/login').type('form').send({ email: datos.email, password: datos.password });
    expect(ok.status).toBe(302);
    const mal = await request(app).post('/auth/login').type('form').send({ email: datos.email, password: 'incorrecta1' });
    expect(mal.status).toBe(401);
  });

  test('una ruta privada redirige al login si no hay sesión', async () => {
    const res = await request(app).get('/recetas/nueva');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  test('el logout revoca el refresh token', async () => {
    const agent = request.agent(app);
    await agent.post('/auth/register').type('form').send(datos);
    const res = await agent.post('/auth/logout');
    expect(res.status).toBe(302);
    const user = await User.findOne({ email: datos.email }).select('+refreshTokenHash');
    expect(user.refreshTokenHash).toBeNull();
    expect((await agent.get('/recetas/nueva')).status).toBe(302);
  });
});
