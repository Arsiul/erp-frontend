import { describe, expect, it } from 'vitest';

import { round2 } from './money';

describe('round2', () => {
  it('redondea la mitad hacia arriba como el backend', () => {
    expect(round2(13.25 * 0.18)).toBe(2.39);
    expect(round2(16.75 * 0.18)).toBe(3.02);
    expect(round2(23.25 * 0.18)).toBe(4.19);
    expect(round2(26.25 * 0.18)).toBe(4.73);
    expect(round2(5.015)).toBe(5.02);
    expect(round2(1.005)).toBe(1.01);
  });

  it('aleja la mitad de cero en negativos', () => {
    expect(round2(-5.015)).toBe(-5.02);
    expect(round2(-1.234)).toBe(-1.23);
  });

  it('deja intactos los importes exactos', () => {
    expect(round2(0)).toBe(0);
    expect(round2(10.1)).toBe(10.1);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });
});
