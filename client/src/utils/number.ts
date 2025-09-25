export const normalizeNumber = (value: string | number | undefined): number => {
  if (typeof value === 'number') {
    return value;
  }
  if (!value) {
    return 0;
  }
  const cleaned = value
    .toString()
    .replace(/[\s\u00A0]/g, '')
    .replace(/[^0-9.,-]/g, '')
    .replace(',', '.');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};
