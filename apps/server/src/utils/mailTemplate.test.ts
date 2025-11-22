
import { describe, expect, it } from 'vitest';
import { passwordResetTemplate, welcomeTemplate } from './mailTemplate';

describe('utils/mailTemplate', () => {
  it('passwordResetTemplate includes link and optional username', () => {
    const html = passwordResetTemplate('https://example.com/reset', 'Alice');
    expect(html).toContain('https://example.com/reset');
    expect(html).toContain('Hi Alice');
    expect(html).toContain('OpsiMate');
  });

  it('welcomeTemplate uses default body when no customBody', () => {
    const html = welcomeTemplate(undefined, 'Bob');
    expect(html).toContain('Welcome aboard');
    expect(html).toContain('Bob');
    expect(html).toContain('OpsiMate');
  });

  it('welcomeTemplate uses custom body when provided', () => {
    const custom = '<p>Custom body</p>';
    const html = welcomeTemplate(custom);
    expect(html).toContain(custom);
    expect(html).toContain('OpsiMate');
  });
});

