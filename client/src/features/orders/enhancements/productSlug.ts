const removeDiacritics = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae');

export const toProductSlug = (value: string) =>
  removeDiacritics(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const fromProductSlug = (slug: string) =>
  slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const findProductBySlug = (products: string[], slug?: string | null) => {
  if (!slug) {
    return undefined;
  }
  const normalized = slug.toLowerCase();
  return products.find((product) => toProductSlug(product) === normalized);
};
