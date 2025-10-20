import { useEffect, useState } from 'react';
import { useOrdersStore } from '../../store/ordersStore';
import { fetchDailyStats, fetchOrders, parseSheetLink, updateOrder } from '../../lib/api';
import { Order } from '../../types/order';
import { toast } from 'react-hot-toast';

type ErrorWithResponse = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

type ErrorWithMessage = {
  message?: string;
};

const isErrorWithResponse = (error: unknown): error is ErrorWithResponse =>
  typeof error === 'object' && error !== null && 'response' in error;

const isErrorWithMessage = (error: unknown): error is ErrorWithMessage =>
  typeof error === 'object' && error !== null && 'message' in error;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isErrorWithResponse(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }

  if (isErrorWithMessage(error) && typeof error.message === 'string') {
    return error.message;
  }

  return fallback;
};

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
    } catch (error) {
      const message = getErrorMessage(error, 'Impossible de se connecter à Google Sheets');
      setError(message);
      toast.error(message);
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
    } catch (error) {
      const message = getErrorMessage(error, 'Erreur lors du chargement des commandes');
      setError(message);
      toast.error(message);
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
    } catch (error) {
      const message = getErrorMessage(error, 'Impossible de sauvegarder la commande');
      toast.error(message);
    } finally {
      setSaving(orderId, false);
    }
  };

  useEffect(() => {
    if (connection?.sheetId) {
      loadOrders(connection.sheetId, connection.sheetRange, connection.method, undefined, undefined, connection.sheetName);
    }
  }, [connection?.sheetId]);

  useEffect(() => {
    if (connection?.sheetId) {
      loadStats(connection.sheetId, filters.date);
    }
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
