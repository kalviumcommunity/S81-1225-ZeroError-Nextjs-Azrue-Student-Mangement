import { multiply } from '../src/utils/math';

test('multiplies two numbers correctly', () => {
  expect(multiply(2, 3)).toBe(6);
});
