import { describe, expect, it } from 'vitest';
import { extractCity } from '../src/utils/city';

describe('extractCity', () => {
  it('detecte une ville connue', () => {
    expect(extractCity('Rue principale, Douala')).toBe('Douala');
  });

  it('retourne le dernier segment sinon', () => {
    expect(extractCity('Quartier, Inconnue City')).toBe('Inconnue City');
  });

  it('retourne undefined si vide', () => {
    expect(extractCity('')).toBeUndefined();
  });
});
