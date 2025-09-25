import { ChangeEvent } from 'react';
import { OrdersFilters, useOrdersStore } from '../../../store/ordersStore';
const FiltersBar = ({
  filters,
  isLoading,
  onFiltersChange,
  onRefresh
}: {
  filters: OrdersFilters;
  isLoading: boolean;
  onFiltersChange: (filters: Partial<OrdersFilters>) => void;
  onRefresh: () => void;
}) => {
  const orders = useOrdersStore((state) => state.orders);
  const connection = useOrdersStore((state) => state.connection);
  const cities = Array.from(new Set(orders.map((order) => order.city).filter(Boolean))) as string[];

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    onFiltersChange({ [name]: value || undefined });
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm">
      <div className="flex w-full flex-col sm:w-auto">
        <label className="text-xs font-medium uppercase text-slate-500">Date</label>
        <input
          type="date"
          name="date"
          value={filters.date}
          onChange={handleChange}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="flex w-full flex-col sm:w-40">
        <label className="text-xs font-medium uppercase text-slate-500">Ville</label>
        <select
          name="city"
          value={filters.city ?? ''}
          onChange={handleChange}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Toutes</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>
      <div className="flex w-full flex-col sm:w-44">
        <label className="text-xs font-medium uppercase text-slate-500">Adresse</label>
        <input
          type="text"
          name="address"
          value={filters.address ?? ''}
          onChange={handleChange}
          placeholder="Rechercher..."
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="flex w-full flex-col sm:w-44">
        <label className="text-xs font-medium uppercase text-slate-500">Produit</label>
        <input
          type="text"
          name="product"
          value={filters.product ?? ''}
          onChange={handleChange}
          placeholder="Produit"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="flex w-full flex-col sm:w-40">
        <label className="text-xs font-medium uppercase text-slate-500">Téléphone</label>
        <input
          type="text"
          name="phone"
          value={filters.phone ?? ''}
          onChange={handleChange}
          placeholder="Téléphone"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="flex w-full flex-col sm:flex-1">
        <label className="text-xs font-medium uppercase text-slate-500">Recherche globale</label>
        <input
          type="text"
          name="search"
          value={filters.search ?? ''}
          onChange={handleChange}
          placeholder="Nom, adresse, produit, téléphone..."
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isLoading || !connection?.url}
        className="mt-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        Rafraîchir
      </button>
    </div>
  );
};

export default FiltersBar;
