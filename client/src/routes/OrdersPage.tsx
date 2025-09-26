import { useEffect, useMemo, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useOrdersData } from '../features/orders/useOrdersData';
import { useOrdersStore } from '../store/ordersStore';
import OrdersTable from '../features/orders/components/OrdersTable';
import FiltersBar from '../features/orders/components/FiltersBar';
import SheetConnector from '../features/orders/components/SheetConnector';
import KpiCards from '../features/orders/components/KpiCards';
import SalesChart from '../features/orders/components/SalesChart';
import { exportOrdersCsv } from '../lib/api';
import MappingModal from '../features/orders/components/MappingModal';
import { useUrlState } from '../hooks/useUrlState';
import { useSearchParams } from 'react-router-dom';
import { ENABLE_ENHANCED_UI } from '../config/featureFlags';
import FilterBarV2 from '../features/orders/enhancements/FilterBarV2';
import OrdersNavigation from '../features/orders/enhancements/OrdersNavigation';
import EnhancedOrdersTable from '../features/orders/enhancements/EnhancedOrdersTable';
import { useAllProducts, useTopProducts } from '../store/selectors/ordersSelectors';

const OrdersPage = () => {
  const { connect, handleUpdateOrder, stats, filters, setFilters, loadOrders, setConnection } = useOrdersData();
  const { filtered, connection, isLoading, meta } = useOrdersStore();
  const orders = useOrdersStore((state) => state.orders);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [showMapping, setShowMapping] = useState(false);
  const [searchParams] = useSearchParams();
  useUrlState();

  const productOptions = useAllProducts();
  const computedTopProducts = useTopProducts();
  const topProducts = useMemo(() => {
    const merged = new Map<string, { name: string; total: number; quantity: number }>();
    stats?.topProducts?.forEach((product) => {
      merged.set(product.name, {
        name: product.name,
        total: product.total,
        quantity: 0
      });
    });
    computedTopProducts.forEach((product) => {
      const existing = merged.get(product.name);
      if (existing) {
        existing.total = Math.max(existing.total, product.total);
        existing.quantity = product.quantity;
      } else {
        merged.set(product.name, product);
      }
    });
    return Array.from(merged.values()).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [computedTopProducts, stats?.topProducts]);

  const cities = useMemo(() => {
    const values = new Set<string>();
    orders.forEach((order) => {
      if (order.city) {
        values.add(order.city);
      }
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [orders]);

  useEffect(() => {
    document.title = 'Suivi commandes';
  }, []);

  useEffect(() => {
    setMapping({});
  }, [connection?.sheetId]);

  useEffect(() => {
    const sheetId = searchParams.get('sheetId');
    if (sheetId && !connection?.sheetId) {
      const method = (searchParams.get('method') as 'public-csv' | 'service-account') || 'service-account';
      const range = searchParams.get('range') || undefined;
      const sheetName = searchParams.get('sheetName') || undefined;
      setConnection({
        url: '',
        sheetId,
        sheetName,
        sheetRange: range,
        method
      });
      loadOrders(sheetId, range ?? undefined, method, searchParams.get('gid') ?? undefined, mapping, sheetName ?? undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (meta?.missingHeaders?.length) {
      setShowMapping(true);
    } else {
      setShowMapping(false);
    }
  }, [meta?.missingHeaders]);

  const handleRefresh = () => {
    if (connection?.sheetId) {
      loadOrders(
        connection.sheetId,
        connection.sheetRange,
        connection.method,
        connection.gid,
        mapping,
        connection.sheetName
      );
    }
  };

  const handleApplyMapping = (nextMapping: Record<string, string>) => {
    setMapping(nextMapping);
    if (connection?.sheetId) {
      loadOrders(
        connection.sheetId,
        connection.sheetRange,
        connection.method,
        connection.gid,
        nextMapping,
        connection.sheetName
      );
    }
    setShowMapping(false);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Toaster position="top-right" />
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Suivi des commandes</h1>
            <p className="text-sm text-slate-500">
              Connectez votre Google Sheet pour suivre les ventes du jour, filtrer et éditer en direct.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportOrdersCsv(filtered)}
              className="rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary hover:text-white"
              disabled={!filtered.length}
            >
              Exporter CSV
            </button>
            <SheetConnector onConnect={connect} method={connection?.method} />
          </div>
        </div>
        {ENABLE_ENHANCED_UI && (
          <div className="mx-auto flex max-w-7xl justify-end px-4 pb-4">
            <OrdersNavigation />
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <section className="mb-6 grid gap-4 lg:grid-cols-4">
          <KpiCards stats={stats} isLoading={isLoading} totalOrders={filtered.length} />
        </section>

        <section className="mb-6">
          {ENABLE_ENHANCED_UI ? (
            <FilterBarV2
              filters={filters}
              onFiltersChange={setFilters}
              onRefresh={handleRefresh}
              isLoading={isLoading}
              products={productOptions}
              topProducts={topProducts}
              cities={cities}
              connection={connection}
            />
          ) : (
            <FiltersBar
              filters={filters}
              onFiltersChange={setFilters}
              onRefresh={handleRefresh}
              isLoading={isLoading}
            />
          )}
        </section>

        <section className="mb-6">
          <SalesChart stats={stats} />
        </section>

        {ENABLE_ENHANCED_UI ? (
          <EnhancedOrdersTable orders={filtered} isLoading={isLoading} onUpdate={handleUpdateOrder} />
        ) : (
          <section className="rounded-lg bg-white p-4 shadow-sm">
            <OrdersTable orders={filtered} isLoading={isLoading} onUpdate={handleUpdateOrder} />
          </section>
        )}
      </main>
      <MappingModal
        isOpen={Boolean(meta?.missingHeaders?.length) && showMapping}
        missing={meta?.missingHeaders ?? []}
        available={meta?.availableHeaders ?? []}
        onClose={() => setShowMapping(false)}
        onApply={handleApplyMapping}
      />
    </div>
  );
};

export default OrdersPage;
