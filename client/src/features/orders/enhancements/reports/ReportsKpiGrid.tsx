import { CreditCard, MapPin, ShoppingCart, TrendingUp } from 'lucide-react';

type ReportsKpiGridProps = {
  totalSales: number;
  totalOrders: number;
  averageBasket: number;
  uniqueCities: number;
  isLoading: boolean;
};

const formatCurrency = (value: number) => `${value.toLocaleString('fr-FR')} FCFA`;

const ReportsKpiGrid = ({ totalSales, totalOrders, averageBasket, uniqueCities, isLoading }: ReportsKpiGridProps) => {
  const cards = [
    {
      label: 'Chiffre d’affaires',
      value: formatCurrency(totalSales),
      icon: <TrendingUp className="h-5 w-5 text-primary" />
    },
    {
      label: 'Commandes filtrées',
      value: totalOrders.toLocaleString('fr-FR'),
      icon: <ShoppingCart className="h-5 w-5 text-primary" />
    },
    {
      label: 'Panier moyen',
      value: formatCurrency(averageBasket),
      icon: <CreditCard className="h-5 w-5 text-primary" />
    },
    {
      label: 'Villes couvertes',
      value: uniqueCities.toLocaleString('fr-FR'),
      icon: <MapPin className="h-5 w-5 text-primary" />
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-800">
                {isLoading ? <span className="inline-block h-6 w-24 animate-pulse rounded bg-slate-200" /> : card.value}
              </p>
            </div>
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReportsKpiGrid;
