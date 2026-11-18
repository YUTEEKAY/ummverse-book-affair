// @ts-ignore bun test runner types
import { describe, it, expect } from 'bun:test';
import { FEATURED_SLOTS, featuredSlot } from './featuredBooks';

describe('homepage featured positions', () => {
  it('offers exactly three featured positions', () => {
    expect([...FEATURED_SLOTS]).toEqual([1, 2, 3]);
    expect(featuredSlot('4')).toBeNull();
  });
});