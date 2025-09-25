import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getOrdersCache } from '../services/orderCache';

const router = Router();

const sameDay = (dateIso: string | undefined, target: string): boolean => {
  if (!dateIso) return false;
  return dateIso.startsWith(target);
};

router.get('/daily', (req, res) => {
  const { sheetId, date } = req.query as Record<string, string>;
  if (!sheetId) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'sheetId requis' });
  }

  const cache = getOrdersCache(sheetId);
  if (!cache) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Aucune donnée disponible. Rechargez les commandes.' });
  }

  const targetDate = date ?? new Date().toISOString().slice(0, 10);
  const orders = cache.orders.filter((order) => sameDay(order.createdDate, targetDate));
  const totalSales = orders.reduce((sum, order) => sum + order.subtotal, 0);
  const totalOrders = orders.length;
  const averageBasket = totalOrders ? Math.round(totalSales / totalOrders) : 0;

  const topProductsMap = new Map<string, number>();
  const topCitiesMap = new Map<string, number>();
  orders.forEach((order) => {
    topProductsMap.set(order.productName, (topProductsMap.get(order.productName) ?? 0) + order.subtotal);
    if (order.city) {
      topCitiesMap.set(order.city, (topCitiesMap.get(order.city) ?? 0) + order.subtotal);
    }
  });

  const topProducts = Array.from(topProductsMap.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const topCities = Array.from(topCitiesMap.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return res.json({ totalSales, totalOrders, averageBasket, topProducts, topCities });
});

export default router;
