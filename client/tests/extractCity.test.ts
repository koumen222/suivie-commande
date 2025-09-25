import { describe, expect, it } from 'vitest';
import { extractCity } from '../src/utils/extractCity';

describe('extractCity', () => {
  it('retourne la ville exacte si elle est connue', () => {
    expect(extractCity('123 rue des Fleurs, Douala')).toBe('Douala');
  });

  it('retourne le dernier segment si aucune ville connue', () => {
    expect(extractCity('Quartier X, Ville inconnue')).toBe('Ville inconnue');
  });

  it('retourne undefined si vide', () => {
    expect(extractCity('')).toBeUndefined();
  });
});
