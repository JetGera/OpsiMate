import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import {
  loadConfig,
  getServerConfig,
  getDatabaseConfig,
  getMailerConfig,
  isEmailEnabled,
} from './config';

const ORIGINAL_ENV = { ...process.env };

describe('config/loadConfig', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.CONFIG_FILE;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it('returns defaults when CONFIG_FILE is missing', () => {
    const cfg = loadConfig();
    expect(cfg.server.port).toBe(3001);
    expect(getServerConfig().host).toBeDefined();
    expect(getDatabaseConfig().path).toContain('opsimate.db');
    expect(isEmailEnabled()).toBe(false);
  });

  it('disables mailer when enabled but incomplete SMTP config (fake file)', () => {
    // FAKE: create a temporary config file content and point CONFIG_FILE to it
    const tmpPath = `${process.cwd()}/tmp-config.yaml`;
    const fakeConfig = {
      server: { port: 4000, host: '127.0.0.1' },
      database: { path: './opsimate.db' },
      security: { private_keys_path: './keys' },
      mailer: { enabled: true, host: 'smtp.example.com' }, // missing port/auth
    };
    fs.writeFileSync(tmpPath, yaml.dump(fakeConfig), 'utf8');
    process.env.CONFIG_FILE = tmpPath;

    const cfg = loadConfig();
    expect(cfg.server.port).toBe(4000);
    expect(getMailerConfig()?.enabled).toBe(false);

    fs.unlinkSync(tmpPath);
  });

  it('throws for invalid config missing required fields', () => {
    const tmpPath = `${process.cwd()}/tmp-invalid-config.yaml`;
    const invalid = { server: { port: 4000 } }; // missing database/security
    fs.writeFileSync(tmpPath, yaml.dump(invalid), 'utf8');
    process.env.CONFIG_FILE = tmpPath;

    // STUB: spy on fs to ensure file exists and reads
    const existsSpy = vi.spyOn(fs, 'existsSync');
    existsSpy.mockReturnValue(true);

    expect(() => loadConfig()).toThrowError();

    fs.unlinkSync(tmpPath);
  });
});

