import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useMemo } from 'react';
import { useOrdersStore } from '../../../store/ordersStore';

const SalesChart = ({
  stats
}: {
  stats?: {
    totalSales: number;
    totalOrders: number;
    averageBasket: number;
    topCities: { name: string; total: number }[];
    topProducts: { name: string; total: number }[];
  };
}) => {
  const { filtered } = useOrdersStore();

  const data = useMemo(() => {
    const byHour: Record<string, number> = {};
    filtered.forEach((order) => {
      if (!order.createdDate) {
        return;
      }
      const date = new Date(order.createdDate);
      const key = `${date.getHours().toString().padStart(2, '0')}h`;
      byHour[key] = (byHour[key] ?? 0) + order.subtotal;
    });

    return Object.entries(byHour)
      .sort()
      .map(([hour, total]) => ({ hour, total }));
  }, [filtered]);

  if (!filtered.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-white text-sm text-slate-400 shadow-sm">
        Importez des commandes pour afficher le graphique des ventes.
      </div>
    );
  }

  return (
    <div className="h-72 rounded-lg bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-800">Ventes par heure</h3>
      <p className="text-sm text-slate-500">
        Somme des sous-totaux (FCFA) — Total sélection: {stats?.totalSales?.toLocaleString('fr-FR') ?? '0'}
      </p>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 16, bottom: 8, left: 0 }}>
          <XAxis dataKey="hour" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => value.toLocaleString('fr-FR')} />
          <Tooltip formatter={(value: number) => `${value.toLocaleString('fr-FR')} FCFA`} />
          <Bar dataKey="total" fill="#2563eb" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;
