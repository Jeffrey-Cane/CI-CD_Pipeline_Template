'use strict';

/**
 * Integration tests run against a fully running stack (app + postgres + redis)
 * started via docker-compose. They talk to the app over HTTP using the address
 * in APP_BASE_URL (defaults to the compose service name).
 */
const BASE_URL = process.env.APP_BASE_URL || 'http://app:8080';

async function req(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

describe('reference app (integration, live stack)', () => {
  test('GET / responds', async () => {
    const res = await req('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name');
  });

  test('GET /health reports database and redis healthy', async () => {
    const res = await req('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.checks.database).toBe('ok');
    expect(res.body.checks.redis).toBe('ok');
  });

  test('auth flow persists the session in redis across requests', async () => {
    const login = await req('/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'password' }),
    });
    expect(login.status).toBe(200);
    const token = login.body.token;
    expect(token).toBeTruthy();

    const me = await req('/me', { headers: { authorization: `Bearer ${token}` } });
    expect(me.status).toBe(200);
    expect(me.body.username).toBe('admin');

    const logout = await req('/logout', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(logout.status).toBe(200);

    const after = await req('/me', { headers: { authorization: `Bearer ${token}` } });
    expect(after.status).toBe(401);
  });
});
