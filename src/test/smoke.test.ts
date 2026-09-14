import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('environment works', () => {
    expect(1 + 1).toBe(2);
  });

  it('localStorage is available', () => {
    localStorage.setItem('k', 'v');
    expect(localStorage.getItem('k')).toBe('v');
  });
});
