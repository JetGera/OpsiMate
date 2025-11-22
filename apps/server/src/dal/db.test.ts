import { describe, expect, it, vi, afterEach } from 'vitest';

describe('dal/runAsync', () => {
  it('resolves with function result', async () => {
    const { runAsync } = await import('./db');
    const result = await runAsync(() => 42);
    expect(result).toBe(42);
  });

  it('rejects with error when function throws', async () => {
    const { runAsync } = await import('./db');
    await expect(runAsync(() => {
      throw new Error('boom');
    })).rejects.toThrow('boom');
  });
});

describe('dal/initializeDb', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns a database connection (smoke test)', async () => {

    const { initializeDb } = await import('./db');
    const db = initializeDb();
    // @ts-ignore
    if (typeof db.close === 'function') db.close();
    expect(db).toBeTruthy();
  });
});
