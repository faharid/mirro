export function executeCalculator(
  expression: string,
): { result: number | string } {
  const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '');
  if (!sanitized.trim()) {
    return { result: 'Invalid expression' };
  }
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${sanitized})`)() as number;
    if (typeof result !== 'number' || !isFinite(result)) {
      return { result: 'Invalid result' };
    }
    return { result };
  } catch {
    return { result: 'Calculation error' };
  }
}
