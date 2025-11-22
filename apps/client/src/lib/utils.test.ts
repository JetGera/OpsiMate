import { describe, expect, it } from 'vitest';
import { cn, removeDuplicates } from './utils';

describe('client/lib/utils', () => {
  it('cn merges class names with tailwind-merge semantics', () => {
    const classes = cn('p-2', 'p-4', 'text-sm', false && 'hidden');
    expect(classes).toContain('p-4');
    expect(classes).toContain('text-sm');
    expect(classes).not.toContain('p-2 ');
  });

  it('removeDuplicates removes objects with duplicate key values', () => {
    const input = [
      { id: 1, name: 'a' },
      { id: 1, name: 'a-dup' },
      { id: 2, name: 'b' },
    ];
    const out = removeDuplicates(input, 'id');
    expect(out).toHaveLength(2);
    const ids = out.map((x) => x.id).sort();
    expect(ids).toEqual([1, 2]);
  });
});
