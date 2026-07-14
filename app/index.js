'use strict';

const { createApp } = require('./server');

const port = Number(process.env.APP_PORT || 8080);

/**
 * Lazily construct optional backing services. They are only wired up when the
 * relevant environment variables are present so the app still boots (and serves
 * a degraded /health) when a dependency is unavailable.
 */
function buildDependencies() {
  const deps = {};

  if (process.env.DATABASE_URL || process.env.POSTGRES_HOST) {
    const { Pool } = require('pg');
    deps.pool = new Pool(
      process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL }
        : {
            host: process.env.POSTGRES_HOST,
            port: Number(process.env.POSTGRES_PORT || 5432),
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            database: process.env.POSTGRES_DB,
          },
    );
  }

  if (process.env.REDIS_URL) {
    const Redis = require('ioredis');
    deps.redis = new Redis(process.env.REDIS_URL, {
      lazyConnect: false,
      maxRetriesPerRequest: 2,
    });
    deps.redis.on('error', (err) => {
      console.error('redis error:', err.message);
    });
  }

  return deps;
}

const app = createApp(buildDependencies());

const server = app.listen(port, () => {
  console.log(`listening on port ${port}`);
});

function shutdown(signal) {
  console.log(`received ${signal}, shutting down`);
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = { app, server };
