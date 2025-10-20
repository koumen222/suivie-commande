import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { CalendarRange } from 'lucide-react';

type SalesTrendCardProps = {
  data: { date: string; total: number; orders: number }[];
  isLoading: boolean;
};

const SalesTrendCard = ({ data, isLoading }: SalesTrendCardProps) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2">
        <CalendarRange className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold text-slate-800">Courbe des ventes</h3>
      </div>
      <p className="mt-1 text-sm text-slate-500">Somme des sous-totaux par jour.</p>
      <div className="mt-4 h-72">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Importez des commandes pour visualiser la courbe.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 16, bottom: 8, left: 0 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} angle={-20} dy={12} height={50} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => value.toLocaleString('fr-FR')} />
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString('fr-FR')} FCFA`}
                labelFormatter={(label) => `Date : ${label}`}
              />
              <Area type="monotone" dataKey="total" stroke="#2563eb" fill="url(#salesGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default SalesTrendCard;
