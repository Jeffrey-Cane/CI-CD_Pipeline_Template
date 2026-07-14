'use strict';

const express = require('express');
const crypto = require('crypto');

/**
 * Build the Express application.
 *
 * Dependencies (Postgres pool, Redis client) are injected so the same app can
 * be exercised by fast unit tests (no dependencies) and by integration tests
 * (real Postgres + Redis) without changing application code.
 *
 * @param {object} [deps]
 * @param {import('pg').Pool} [deps.pool]   Postgres connection pool.
 * @param {import('ioredis').Redis} [deps.redis] Redis client.
 * @returns {import('express').Express}
 */
function createApp(deps = {}) {
  const { pool, redis } = deps;
  const app = express();
  const startedAt = Date.now();

  app.use(express.json());
  app.disable('x-powered-by');

  // Demo credentials. Real adopters should replace this with their own
  // authentication backend; it exists so the smoke test can exercise a
  // login/logout flow end to end.
  const demoUser = process.env.DEMO_USER || 'admin';
  const demoPassword = process.env.DEMO_PASSWORD || 'password';

  // Session store: prefer Redis when available, otherwise fall back to an
  // in-memory Map (fine for unit tests and single-instance demos).
  const memorySessions = new Map();
  const SESSION_TTL_SECONDS = 60 * 60;

  async function saveSession(token, value) {
    if (redis) {
      await redis.set(`session:${token}`, value, 'EX', SESSION_TTL_SECONDS);
    } else {
      memorySessions.set(token, value);
    }
  }

  async function readSession(token) {
    if (redis) {
      return redis.get(`session:${token}`);
    }
    return memorySessions.get(token) || null;
  }

  async function deleteSession(token) {
    if (redis) {
      await redis.del(`session:${token}`);
    } else {
      memorySessions.delete(token);
    }
  }

  function bearerToken(req) {
    const header = req.get('authorization') || '';
    const [scheme, token] = header.split(' ');
    return scheme === 'Bearer' && token ? token : null;
  }

  app.get('/', (req, res) => {
    res.json({
      name: process.env.APP_NAME || 'myapp',
      message: 'Reference app for the reusable CI/CD pipeline template',
      uptime_s: Math.round((Date.now() - startedAt) / 1000),
    });
  });

  app.get('/health', async (req, res) => {
    const checks = {};
    let healthy = true;

    if (pool) {
      try {
        await pool.query('SELECT 1');
        checks.database = 'ok';
      } catch {
        checks.database = 'error';
        healthy = false;
      }
    }

    if (redis) {
      try {
        await redis.ping();
        checks.redis = 'ok';
      } catch {
        checks.redis = 'error';
        healthy = false;
      }
    }

    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      uptime_s: Math.round((Date.now() - startedAt) / 1000),
      checks,
    });
  });

  app.post('/login', async (req, res) => {
    const { username, password } = req.body || {};
    if (username !== demoUser || password !== demoPassword) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    const token = crypto.randomBytes(24).toString('hex');
    await saveSession(token, username);
    return res.status(200).json({ token });
  });

  app.get('/me', async (req, res) => {
    const token = bearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'missing token' });
    }
    const username = await readSession(token);
    if (!username) {
      return res.status(401).json({ error: 'invalid or expired token' });
    }
    return res.status(200).json({ username });
  });

  app.post('/logout', async (req, res) => {
    const token = bearerToken(req);
    if (token) {
      await deleteSession(token);
    }
    return res.status(200).json({ status: 'logged out' });
  });

  return app;
}

module.exports = { createApp };
