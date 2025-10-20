import { shallow } from 'zustand/shallow';
import { useOrdersStore, OrdersState } from '../ordersStore';
import type { Order } from '../../types/order';

type SelectorDeps = unknown[];

type MemoSelector<Result> = (state: OrdersState) => Result;

const isSameDeps = (a: SelectorDeps, b: SelectorDeps) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const createMemoSelector = <Result>(
  getDeps: (state: OrdersState) => SelectorDeps,
  projector: (state: OrdersState) => Result
): MemoSelector<Result> => {
  let lastDeps: SelectorDeps = [];
  let lastResult: Result;
  let initialized = false;

  return (state: OrdersState) => {
    const deps = getDeps(state);
    if (initialized && isSameDeps(deps, lastDeps)) {
      return lastResult;
    }
    initialized = true;
    lastDeps = deps;
    lastResult = projector(state);
    return lastResult;
  };
};

const allProductsSelector = createMemoSelector(
  (state) => [state.orders],
  (state) => {
    const unique = new Set<string>();
    state.orders.forEach((order) => {
      if (order.productName) {
        unique.add(order.productName);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'fr'));
  }
);

const topProductsSelector = createMemoSelector(
  (state) => [state.filtered],
  (state) => {
    const counts = new Map<string, { total: number; quantity: number }>();
    state.filtered.forEach((order) => {
      const entry = counts.get(order.productName) ?? { total: 0, quantity: 0 };
      entry.total += order.subtotal;
      entry.quantity += order.productQuantity ?? 0;
      counts.set(order.productName, entry);
    });

    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }
);

const salesTrendSelector = createMemoSelector(
  (state) => [state.filtered],
  (state) => {
    const byDate = new Map<string, { total: number; orders: Order[] }>();
    state.filtered.forEach((order) => {
      const key = order.createdDate ? new Date(order.createdDate).toISOString().slice(0, 10) : 'Non daté';
      const entry = byDate.get(key) ?? { total: 0, orders: [] };
      entry.total += order.subtotal;
      entry.orders.push(order);
      byDate.set(key, entry);
    });
    return Array.from(byDate.entries())
      .map(([date, value]) => ({
        date,
        total: value.total,
        orders: value.orders.length
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
);

const kpisSelector = createMemoSelector(
  (state) => [state.filtered],
  (state) => {
    const totalSales = state.filtered.reduce((acc, order) => acc + order.subtotal, 0);
    const totalOrders = state.filtered.length;
    const averageBasket = totalOrders ? Math.round(totalSales / totalOrders) : 0;
    const uniqueCities = new Set(state.filtered.map((order) => order.city).filter(Boolean));

    return {
      totalSales,
      totalOrders,
      averageBasket,
      uniqueCities: uniqueCities.size
    };
  }
);

export const useAllProducts = () => useOrdersStore(allProductsSelector, shallow);
export const useTopProducts = () => useOrdersStore(topProductsSelector, shallow);
export const useSalesTrend = () => useOrdersStore(salesTrendSelector, shallow);
export const useOrdersKpis = () => useOrdersStore(kpisSelector, shallow);

export const useOrdersCount = () =>
  useOrdersStore(
    (state) => ({
      total: state.orders.length,
      filtered: state.filtered.length
    }),
    shallow
  );

export const useOrdersMeta = () => useOrdersStore((state) => state.meta);

export const useOrdersConnection = () =>
  useOrdersStore(
    (state) => ({
      connection: state.connection,
      isLoading: state.isLoading
    }),
    shallow
  );
