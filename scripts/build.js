'use strict';

/**
 * Minimal "build" step for the reference Node app.
 *
 * Interpreted languages don't need a compile step, but the pipeline expects a
 * `build` command it can run. This validates that the app loads without throwing
 * so a broken require/syntax error fails the build stage early and cheaply.
 * Replace this with your real build (tsc, webpack, go build, etc.) as needed.
 */
try {
  require('../app/server');
  console.log('build ok: application module loaded successfully');
  process.exit(0);
} catch (err) {
  console.error('build failed:', err.message);
  process.exit(1);
}
