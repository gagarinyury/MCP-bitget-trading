/**
 * Simple test to verify Jest setup
 */

describe('Basic functionality', () => {
  test('should add numbers correctly', () => {
    expect(2 + 2).toBe(4);
  });

  test('should work with strings', () => {
    expect('hello' + ' ' + 'world').toBe('hello world');
  });

  test('should work with arrays', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr).toContain(2);
  });
});