import { DEFAULT_MODELS } from '../src/llm/config/models.config';
import { executeCalculator } from '../src/agents/tools/calculator.tool';

describe('LLM module', () => {
  it('should define default models for all providers', () => {
    expect(DEFAULT_MODELS.openai).toBeDefined();
    expect(DEFAULT_MODELS.anthropic).toBeDefined();
    expect(DEFAULT_MODELS.google).toBeDefined();
    expect(DEFAULT_MODELS.groq).toBe('llama-3.3-70b-versatile');
  });

  it('calculator tool should compute expressions', () => {
    const result = executeCalculator('2 + 2 * 3');
    expect(result.result).toBe(8);
  });

  it('calculator tool should reject invalid input', () => {
    const result = executeCalculator('invalid!!!');
    expect(result.result).toBe('Invalid expression');
  });
});
