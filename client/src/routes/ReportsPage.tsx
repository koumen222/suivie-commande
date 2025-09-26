import { useEffect, useMemo, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { useOrdersData } from '../features/orders/useOrdersData';
import { useOrdersStore } from '../store/ordersStore';
import SheetConnector from '../features/orders/components/SheetConnector';
import FilterBarV2 from '../features/orders/enhancements/FilterBarV2';
import OrdersNavigation from '../features/orders/enhancements/OrdersNavigation';
import ReportsKpiGrid from '../features/orders/enhancements/reports/ReportsKpiGrid';
import TopProductsCard from '../features/orders/enhancements/reports/TopProductsCard';
import SalesTrendCard from '../features/orders/enhancements/reports/SalesTrendCard';
import { exportOrdersCsv } from '../lib/api';
import { useAllProducts, useOrdersKpis, useSalesTrend, useTopProducts } from '../store/selectors/ordersSelectors';
import { useUrlState } from '../hooks/useUrlState';
import { shallow } from 'zustand/shallow';

const ReportsPage = () => {
  const { connect, loadOrders, filters, setFilters, stats, setConnection } = useOrdersData();
  const { connection, isLoading, filtered } = useOrdersStore(
    (state) => ({
      connection: state.connection,
      isLoading: state.isLoading,
      filtered: state.filtered
    }),
    shallow
  );
  const orders = useOrdersStore((state) => state.orders);
  const [searchParams] = useSearchParams();
  const [hydrated, setHydrated] = useState(false);
  useUrlState();

  const productOptions = useAllProducts();
  const kpis = useOrdersKpis();
  const salesTrend = useSalesTrend();
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
    if (hydrated) {
      return;
    }
    setHydrated(true);
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
        method,
        gid: searchParams.get('gid') || undefined
      });
      loadOrders(sheetId, range ?? undefined, method, searchParams.get('gid') ?? undefined, undefined, sheetName ?? undefined);
    }
  }, [connection?.sheetId, hydrated, loadOrders, searchParams, setConnection]);

  const handleRefresh = () => {
    if (connection?.sheetId) {
      loadOrders(
        connection.sheetId,
        connection.sheetRange,
        connection.method,
        connection.gid,
        undefined,
        connection.sheetName
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Toaster position="top-right" />
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Rapports & analyse</h1>
            <p className="text-sm text-slate-500">
              Mesurez vos performances quotidiennes et identifiez les tendances clés grâce aux filtres existants.
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
        <div className="mx-auto flex max-w-7xl justify-end px-4 pb-4">
          <OrdersNavigation />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <section className="mb-6">
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
        </section>

        <section className="mb-6">
          <ReportsKpiGrid
            totalSales={kpis.totalSales}
            totalOrders={kpis.totalOrders}
            averageBasket={kpis.averageBasket}
            uniqueCities={kpis.uniqueCities}
            isLoading={isLoading}
          />
        </section>

        <section className="mb-6 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <SalesTrendCard data={salesTrend} isLoading={isLoading} />
          <TopProductsCard products={topProducts} isLoading={isLoading} />
        </section>
      </main>
    </div>
  );
};

export default ReportsPage;
