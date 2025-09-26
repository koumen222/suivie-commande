import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOrdersStore } from '../store/ordersStore';
import qs from 'qs';
import { ENABLE_ENHANCED_UI } from '../config/featureFlags';
import { fromProductSlug, toProductSlug } from '../features/orders/enhancements/productSlug';

const filterKeys = ['date', 'city', 'address', 'product', 'phone', 'search'] as const;

export const useUrlState = () => {
  const [params, setParams] = useSearchParams();
  const { filters, setFilters, sorts, setSorts, connection } = useOrdersStore();

  useEffect(() => {
    const parsedFilters: Record<string, string> = {};
    filterKeys.forEach((key) => {
      const value = params.get(key);
      if (value) {
        parsedFilters[key] = value;
      }
    });
    if (ENABLE_ENHANCED_UI && !parsedFilters.product) {
      const slug = params.get('produit');
      if (slug) {
        parsedFilters.product = fromProductSlug(slug);
      }
    }

    if (Object.keys(parsedFilters).length > 0) {
      setFilters(parsedFilters);
    }
    const sortParam = params.get('sorts');
    if (sortParam) {
      try {
        const parsed = JSON.parse(sortParam);
        if (Array.isArray(parsed)) {
          setSorts(parsed);
        }
      } catch (error) {
        console.error('Failed to parse sorts param', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const query = qs.stringify(
      {
        ...filters,
        sorts: sorts.length ? JSON.stringify(sorts) : undefined,
        produit: ENABLE_ENHANCED_UI && filters.product ? toProductSlug(filters.product) : undefined,
        sheetId: connection?.sheetId,
        range: connection?.sheetRange,
        method: connection?.method,
        sheetName: connection?.sheetName,
        gid: connection?.gid
      },
      { addQueryPrefix: false, skipNulls: true, encode: false }
    );
    setParams(query);
  }, [filters, sorts, connection, setParams]);
};
