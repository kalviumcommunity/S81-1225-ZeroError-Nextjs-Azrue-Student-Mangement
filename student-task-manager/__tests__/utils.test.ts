/**
 * Simple logic test importing from src
 */
import { add } from '../src/utils/math';

test('adds two numbers correctly', () => {
  expect(add(2, 3)).toBe(5);
});
