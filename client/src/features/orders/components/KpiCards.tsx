const skeletonClass = 'animate-pulse rounded-md bg-slate-200 h-6 w-24';

const KpiCards = ({
  stats,
  isLoading,
  totalOrders
}: {
  stats?: {
    totalSales: number;
    totalOrders: number;
    averageBasket: number;
    topCities: { name: string; total: number }[];
    topProducts: { name: string; total: number }[];
  };
  isLoading: boolean;
  totalOrders: number;
}) => {
  const formatCurrency = (value: number) => `${value.toLocaleString('fr-FR')} FCFA`;

  return (
    <>
      <article className="rounded-xl bg-white p-4 shadow-sm">
        <h3 className="text-sm font-medium text-slate-500">Ventes du jour</h3>
        <p className="mt-2 text-2xl font-semibold text-slate-900">
          {isLoading ? <span className={skeletonClass} /> : formatCurrency(stats?.totalSales ?? 0)}
        </p>
      </article>
      <article className="rounded-xl bg-white p-4 shadow-sm">
        <h3 className="text-sm font-medium text-slate-500">Nombre de commandes</h3>
        <p className="mt-2 text-2xl font-semibold text-slate-900">
          {isLoading ? <span className={skeletonClass} /> : stats?.totalOrders ?? totalOrders}
        </p>
      </article>
      <article className="rounded-xl bg-white p-4 shadow-sm">
        <h3 className="text-sm font-medium text-slate-500">Panier moyen</h3>
        <p className="mt-2 text-2xl font-semibold text-slate-900">
          {isLoading ? <span className={skeletonClass} /> : formatCurrency(stats?.averageBasket ?? 0)}
        </p>
      </article>
      <article className="rounded-xl bg-white p-4 shadow-sm">
        <h3 className="text-sm font-medium text-slate-500">Top villes / produits</h3>
        <div className="mt-2 flex gap-4 text-sm text-slate-600">
          <ul className="flex-1 space-y-1">
            {(stats?.topCities ?? []).slice(0, 3).map((city) => (
              <li key={city.name} className="flex justify-between">
                <span>{city.name}</span>
                <span className="font-medium text-slate-900">{formatCurrency(city.total)}</span>
              </li>
            ))}
            {(!stats?.topCities || !stats.topCities.length) && <li className="text-slate-400">-</li>}
          </ul>
          <ul className="flex-1 space-y-1">
            {(stats?.topProducts ?? []).slice(0, 3).map((product) => (
              <li key={product.name} className="flex justify-between">
                <span className="truncate">{product.name}</span>
                <span className="font-medium text-slate-900">{formatCurrency(product.total)}</span>
              </li>
            ))}
            {(!stats?.topProducts || !stats.topProducts.length) && <li className="text-slate-400">-</li>}
          </ul>
        </div>
      </article>
    </>
  );
};

export default KpiCards;
