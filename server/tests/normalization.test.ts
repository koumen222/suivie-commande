import { describe, expect, it } from 'vitest';
import { computeSubtotal, normalizeNumber } from '../src/utils/normalization';

describe('normalizeNumber', () => {
  it('convertit une chaine avec espaces et monnaie', () => {
    expect(normalizeNumber(' 9 900 CFA')).toBe(9900);
  });

  it('retourne 0 pour valeur invalide', () => {
    expect(normalizeNumber('abc')).toBe(0);
  });
});

describe('computeSubtotal', () => {
  it('calcule le sous-total arrondi', () => {
    expect(computeSubtotal(1234.56, 2)).toBe(2469);
  });
});
