import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./auth', () => ({
  getUserRole: vi.fn(() => null),
}));

import {
  hasPermission,
  canCreate,
  canEdit,
  canDelete,
  canView,
  canOperate,
  canManageIntegrations,
  canViewServices,
} from './permissions';

const { getUserRole } = await import('./auth');

describe('client/lib/permissions', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('viewer can only view (stub)', () => {
    // STUB: force role to viewer for permission checks
    (getUserRole as unknown as vi.Mock).mockReturnValue('viewer');
    expect(hasPermission('view')).toBe(true);
    expect(canView()).toBe(true);
    expect(canCreate()).toBe(false);
    expect(canEdit()).toBe(false);
    expect(canDelete()).toBe(false);
    expect(canOperate()).toBe(false);
  });

  it('editor can create/edit/view but not delete', () => {
    (getUserRole as unknown as vi.Mock).mockReturnValue('editor');
    expect(canCreate()).toBe(true);
    expect(canEdit()).toBe(true);
    expect(canView()).toBe(true);
    expect(canDelete()).toBe(false);
  });

  it('admin can do everything and manage integrations', () => {
    (getUserRole as unknown as vi.Mock).mockReturnValue('admin');
    expect(canCreate()).toBe(true);
    expect(canEdit()).toBe(true);
    expect(canDelete()).toBe(true);
    expect(canManageIntegrations()).toBe(true);
    expect(canViewServices()).toBe(true);
  });

  it('operation can view and operate', () => {
    (getUserRole as unknown as vi.Mock).mockReturnValue('operation');
    expect(canView()).toBe(true);
    expect(canOperate()).toBe(true);
    expect(canCreate()).toBe(false);
  });
});
