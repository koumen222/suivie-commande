import axios from 'axios';
import { Order, OrdersMeta } from '../types/order';

export type ParseLinkResponse = {
  sheetId: string;
  sheetName?: string;
  sheetRange?: string;
  method: 'public-csv' | 'service-account';
  gid?: string;
  csvUrl?: string;
};

export const parseSheetLink = async (url: string): Promise<ParseLinkResponse> => {
  const { data } = await axios.post<ParseLinkResponse>('/api/sheets/parse-link', { url });
  return data;
};

export type OrdersResponse = {
  orders: Order[];
  meta: OrdersMeta;
};

export const fetchOrders = async (params: {
  sheetId: string;
  range?: string;
  method?: 'public-csv' | 'service-account';
  gid?: string;
  mapping?: Record<string, string>;
  sheetName?: string;
}): Promise<OrdersResponse> => {
  const requestParams = {
    ...params,
    mapping: params.mapping ? JSON.stringify(params.mapping) : undefined
  };
  const { data } = await axios.get<OrdersResponse>('/api/orders', { params: requestParams });
  return data;
};

export const updateOrder = async (sheetId: string, orderId: string, changes: Partial<Order>) => {
  const { data } = await axios.put(`/api/orders/${orderId}`, changes, { params: { sheetId } });
  return data as { success: boolean; message: string; order: Order };
};

export const fetchDailyStats = async (params: { sheetId: string; date: string }) => {
  const { data } = await axios.get('/api/stats/daily', { params });
  return data as {
    totalSales: number;
    totalOrders: number;
    averageBasket: number;
    topCities: { name: string; total: number }[];
    topProducts: { name: string; total: number }[];
  };
};

export const exportOrdersCsv = (orders: Order[]) => {
  const headers = [
    'ID',
    'Product Name',
    'Product Price',
    'Product Quantity',
    'Subtotal',
    'First Name',
    'Phone',
    'Address 1',
    'City',
    'Created Date',
    'Product Link'
  ];
  const rows = orders.map((order) => [
    order.id,
    order.productName,
    order.productPrice,
    order.productQuantity,
    order.subtotal,
    order.firstName,
    order.phone,
    order.address1,
    order.city ?? '',
    order.createdDate ?? '',
    order.productLink ?? ''
  ]);
  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((value) => {
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(',')
    )
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `orders-${new Date().toISOString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
