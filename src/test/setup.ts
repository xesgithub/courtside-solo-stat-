// Test setup: runs before each test file.
// Provides a clean localStorage between tests.
import { beforeEach } from 'vitest';

beforeEach(() => {
  localStorage.clear();
});
