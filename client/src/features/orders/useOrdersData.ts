import { useEffect, useState } from 'react';
import { useOrdersStore } from '../../store/ordersStore';
import { fetchDailyStats, fetchOrders, parseSheetLink, updateOrder } from '../../lib/api';
import { Order } from '../../types/order';
import { toast } from 'react-hot-toast';

export const useOrdersData = () => {
  const {
    connection,
    setConnection,
    setOrders,
    setLoading,
    setError,
    filters,
    setFilters,
    updateOrder: updateOrderInStore,
    setSaving,
    meta
  } = useOrdersStore();
  const [stats, setStats] = useState<{
    totalSales: number;
    totalOrders: number;
    averageBasket: number;
    topCities: { name: string; total: number }[];
    topProducts: { name: string; total: number }[];
  }>();

  const connect = async (url: string) => {
    try {
      setLoading(true);
      const parsed = await parseSheetLink(url);
      setConnection({
        url,
        sheetId: parsed.sheetId,
        sheetName: parsed.sheetName,
        sheetRange: parsed.sheetRange,
        method: parsed.method,
        gid: parsed.gid
      });
      await loadOrders(parsed.sheetId, parsed.sheetRange, parsed.method, parsed.gid, undefined, parsed.sheetName);
    } catch (error: any) {
      setError(error?.response?.data?.message ?? 'Impossible de se connecter à Google Sheets');
      toast.error(error?.response?.data?.message ?? 'Erreur de connexion au sheet');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async (
    sheetId: string,
    range?: string,
    method?: 'public-csv' | 'service-account',
    gid?: string,
    mapping?: Record<string, string>,
    sheetName?: string
  ) => {
    try {
      setLoading(true);
      const { orders, meta } = await fetchOrders({ sheetId, range, method, gid, mapping, sheetName });
      setOrders(orders, meta);
      await loadStats(sheetId, filters.date);
    } catch (error: any) {
      setError(error?.response?.data?.message ?? 'Erreur lors du chargement des commandes');
      toast.error(error?.response?.data?.message ?? 'Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (sheetId: string, date: string) => {
    try {
      const statsResponse = await fetchDailyStats({ sheetId, date });
      setStats(statsResponse);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  const handleUpdateOrder = async (orderId: string, changes: Partial<Order>) => {
    if (meta?.method === 'public-csv') {
      toast.error('Le sheet est en lecture seule. Configurez un compte de service pour éditer.');
      return;
    }
    try {
      setSaving(orderId, true);
      if (!connection?.sheetId) {
        throw new Error('Aucune connexion active');
      }
      const { order } = await updateOrder(connection.sheetId, orderId, changes);
      updateOrderInStore(orderId, order);
      toast.success('Commande mise à jour');
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Impossible de sauvegarder la commande';
      toast.error(message);
    } finally {
      setSaving(orderId, false);
    }
  };

  useEffect(() => {
    if (connection?.sheetId) {
      loadOrders(connection.sheetId, connection.sheetRange, connection.method, undefined, undefined, connection.sheetName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection?.sheetId]);

  useEffect(() => {
    if (connection?.sheetId) {
      loadStats(connection.sheetId, filters.date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.date, connection?.sheetId]);

  return {
    connect,
    loadOrders,
    loadStats,
    handleUpdateOrder,
    stats,
    filters,
    setFilters,
    setConnection
  };
};
