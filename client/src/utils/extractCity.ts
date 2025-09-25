import { KNOWN_CITIES } from '../config/cities';

export const extractCity = (address1: string, customCities: string[] = KNOWN_CITIES): string | undefined => {
  if (!address1) {
    return undefined;
  }
  const normalized = address1
    .split(/[;,]/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  for (const token of normalized) {
    const found = customCities.find(
      (city) => city.toLowerCase() === token.toLowerCase() || token.toLowerCase().includes(city.toLowerCase())
    );
    if (found) {
      return found;
    }
  }

  const lastChunk = normalized.at(-1);
  return lastChunk && lastChunk.length > 2 ? lastChunk : undefined;
};
