import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Order, OrdersMeta } from '../types/order';
import type { SortingState } from '@tanstack/react-table';

export type OrdersFilters = {
  date: string;
  city?: string;
  address?: string;
  product?: string;
  phone?: string;
  search?: string;
};

export type SheetConnection = {
  url: string;
  sheetId: string;
  sheetName?: string;
  sheetRange?: string;
  method: 'public-csv' | 'service-account';
  gid?: string;
};

export type OrdersState = {
  orders: Order[];
  filtered: Order[];
  meta?: OrdersMeta;
  connection?: SheetConnection;
  filters: OrdersFilters;
  sorts: SortingState;
  isLoading: boolean;
  isSaving: Record<string, boolean>;
  error?: string;
  setOrders: (orders: Order[], meta?: OrdersMeta) => void;
  setConnection: (connection: SheetConnection) => void;
  setFilters: (filters: Partial<OrdersFilters>) => void;
  setSorts: (sorts: SortingState) => void;
  setLoading: (loading: boolean) => void;
  setError: (message?: string) => void;
  updateOrder: (orderId: string, changes: Partial<Order>) => void;
  setSaving: (orderId: string, saving: boolean) => void;
};

const applyFilters = (orders: Order[], filters: OrdersFilters) => {
  return orders.filter((order) => {
    const dateMatch = filters.date ? order.createdDate?.startsWith(filters.date) ?? false : true;
    const cityMatch = filters.city ? order.city?.toLowerCase().includes(filters.city.toLowerCase()) : true;
    const addressMatch = filters.address
      ? order.address1.toLowerCase().includes(filters.address.toLowerCase())
      : true;
    const productMatch = filters.product
      ? order.productName.toLowerCase().includes(filters.product.toLowerCase())
      : true;
    const phoneMatch = filters.phone ? order.phone.toLowerCase().includes(filters.phone.toLowerCase()) : true;
    const searchMatch = filters.search
      ? [
          order.productName,
          order.address1,
          order.firstName,
          order.phone,
          order.city,
          order.productLink
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(filters.search!.toLowerCase()))
      : true;

    return dateMatch && cityMatch && addressMatch && productMatch && phoneMatch && searchMatch;
  });
};

export const useOrdersStore = create<OrdersState>()(
  devtools((set, get) => ({
    orders: [],
    filtered: [],
    filters: {
      date: new Date().toISOString().slice(0, 10)
    },
    sorts: [],
    isLoading: false,
    isSaving: {},
    setOrders: (orders, meta) => {
      const { filters } = get();
      set({ orders, filtered: applyFilters(orders, filters), meta });
    },
    setConnection: (connection) => set({ connection }),
    setFilters: (incoming) => {
      const filters = { ...get().filters, ...incoming };
      const filtered = applyFilters(get().orders, filters);
      set({ filters, filtered });
    },
    setSorts: (sorts) => set({ sorts }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    updateOrder: (orderId, changes) => {
      const nextOrders = get().orders.map((order) => (order.id === orderId ? { ...order, ...changes } : order));
      const filtered = applyFilters(nextOrders, get().filters);
      set({ orders: nextOrders, filtered });
    },
    setSaving: (orderId, saving) => {
      const nextSaving = { ...get().isSaving };
      nextSaving[orderId] = saving;
      set({ isSaving: nextSaving });
    }
  }))
);
