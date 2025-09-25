import { Order, SheetMeta } from '../types/order';

type CacheEntry = {
  orders: Order[];
  rawRows: Record<string, string>[];
  meta: SheetMeta;
};

const cache = new Map<string, CacheEntry>();

export const setOrdersCache = (sheetId: string, entry: CacheEntry) => {
  cache.set(sheetId, entry);
};

export const getOrdersCache = (sheetId: string): CacheEntry | undefined => cache.get(sheetId);

export const updateCachedOrder = (sheetId: string, orderId: string, changes: Partial<Order>) => {
  const entry = cache.get(sheetId);
  if (!entry) {
    return;
  }
  entry.orders = entry.orders.map((order) => (order.id === orderId ? { ...order, ...changes } : order));
  const index = entry.rawRows.findIndex((_, idx) => String(idx + 2) === orderId);
  if (index >= 0) {
    const updatedRow = { ...entry.rawRows[index] };
    for (const [key, value] of Object.entries(changes)) {
      const header = entry.meta.mapping[key];
      if (header) {
        updatedRow[header] = value !== undefined ? String(value) : updatedRow[header];
      }
    }
    entry.rawRows[index] = updatedRow;
  }
  cache.set(sheetId, entry);
};
