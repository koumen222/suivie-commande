import { describe, expect, it } from 'vitest';
import { parseCsvOrders } from '../src/utils/orders';
import { readFileSync } from 'fs';

describe('parseCsvOrders', () => {
  it('parse le csv mock et calcule les sous-totaux', () => {
    const csv = readFileSync(new URL('../mock/orders.csv', import.meta.url), 'utf-8');
    const result = parseCsvOrders(csv);
    expect(result.orders).toHaveLength(3);
    expect(result.orders[0].subtotal).toBe(50000);
    expect(result.mapping.productName).toBe('Product Name');
  });
});
