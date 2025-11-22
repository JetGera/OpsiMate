import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../config/config', () => ({
  isEmailEnabled: vi.fn(() => false),
}));

const { isEmailEnabled } = await import('../config/config');

describe('api/health router', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  async function buildApp() {
    const router = (await import('./health')).default;
    const app = express();
    app.use('/', router);
    return app;
  }

  it('GET /health returns ok', async () => {
    const app = await buildApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.text).toBe('ok');
  });

  it('GET / returns welcome json', async () => {
    const app = await buildApp();
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /email-status returns structured boolean payload', async () => {

    const app = await buildApp();
    const res = await request(app).get('/email-status');
    expect(res.status).toBe(200);
    expect(typeof res.body?.data?.isEmailEnabled).toBe('boolean');
  });
});

