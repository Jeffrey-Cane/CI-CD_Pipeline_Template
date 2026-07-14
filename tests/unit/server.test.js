'use strict';

const request = require('supertest');
const { createApp } = require('../../app/server');

describe('reference app (unit, no external deps)', () => {
  const app = createApp();

  test('GET / returns app metadata', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('message');
  });

  test('GET /health returns ok when no deps are configured', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /login rejects bad credentials', async () => {
    const res = await request(app).post('/login').send({ username: 'nope', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('login → /me → logout flow works with in-memory sessions', async () => {
    const login = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'password' });
    expect(login.status).toBe(200);
    const { token } = login.body;
    expect(token).toBeTruthy();

    const me = await request(app).get('/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.username).toBe('admin');

    const logout = await request(app).post('/logout').set('Authorization', `Bearer ${token}`);
    expect(logout.status).toBe(200);

    const after = await request(app).get('/me').set('Authorization', `Bearer ${token}`);
    expect(after.status).toBe(401);
  });

  test('GET /me without a token is unauthorized', async () => {
    const res = await request(app).get('/me');
    expect(res.status).toBe(401);
  });
});
