import { executeCalculator } from '../src/agents/tools/calculator.tool';

describe('Tool executor helpers', () => {
  it('calculator evaluates expressions', () => {
    const result = executeCalculator('2 + 2 * 3');
    expect(result).toEqual({ result: 8 });
  });

  it('calculator sanitizes invalid expressions', () => {
    const result = executeCalculator('import os');
    expect(result.result).toBe('Invalid expression');
  });
});
