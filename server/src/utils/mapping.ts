const NORMALIZED_HEADERS: Record<string, string[]> = {
  productName: ['product name', 'product'],
  productPrice: ['product price', 'price'],
  productQuantity: ['product quantity', 'quantity', 'qty'],
  address1: ['address 1', 'address1', 'address'],
  firstName: ['first name', 'name', 'customer name'],
  phone: ['phone', 'phone number', 'telephone'],
  productLink: ['product link', 'link'],
  createdDate: ['created date', 'date', 'order date']
};

export type HeaderMapping = Record<string, string>;

export const detectHeaders = (headers: string[], overrides?: Record<string, string>): {
  mapping: HeaderMapping;
  missing: string[];
} => {
  const normalizedHeaders = headers.map((header) => header.trim());
  const mapping: HeaderMapping = {};

  for (const [key, candidates] of Object.entries(NORMALIZED_HEADERS)) {
    if (overrides?.[key]) {
      mapping[key] = overrides[key];
      continue;
    }
    const found = normalizedHeaders.find((header) => {
      const normalizedHeader = header.replace(/\s+/g, ' ').toLowerCase();
      return candidates.some((candidate) => normalizedHeader === candidate);
    });
    if (found) {
      mapping[key] = found;
    }
  }

  const missing = Object.keys(NORMALIZED_HEADERS).filter((key) => !mapping[key]);
  return { mapping, missing };
};

export const normalizeHeaderKey = (header: string): string => header.trim();
