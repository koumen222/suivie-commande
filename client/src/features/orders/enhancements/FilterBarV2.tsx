import { ChangeEvent, useEffect, useMemo, useRef } from 'react';
import { Sparkles, X } from 'lucide-react';
import { OrdersFilters, SheetConnection } from '../../../store/ordersStore';
import { findProductBySlug, fromProductSlug, toProductSlug } from './productSlug';

const STORAGE_KEY = 'orders:product-preselection';

type FilterBarV2Props = {
  filters: OrdersFilters;
  isLoading: boolean;
  onFiltersChange: (filters: Partial<OrdersFilters>) => void;
  onRefresh: () => void;
  products: string[];
  topProducts: { name: string; total: number; quantity: number }[];
  cities: string[];
  connection?: SheetConnection;
};

const schedulePersist = (callback: () => void) => {
  if (typeof window === 'undefined') {
    return;
  }
  const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
  if (typeof idle === 'function') {
    idle(callback);
    return;
  }
  window.setTimeout(callback, 0);
};

const FilterBarV2 = ({
  filters,
  isLoading,
  onFiltersChange,
  onRefresh,
  products,
  topProducts,
  cities,
  connection
}: FilterBarV2Props) => {
  const hydrated = useRef(false);
  const productSlug = filters.product ? toProductSlug(filters.product) : undefined;

  useEffect(() => {
    if (hydrated.current || filters.product) {
      return;
    }
    hydrated.current = true;
    try {
      const savedSlug = localStorage.getItem(STORAGE_KEY);
      if (!savedSlug) {
        return;
      }
      const match = findProductBySlug(products, savedSlug);
      const nextValue = match ?? fromProductSlug(savedSlug);
      if (nextValue) {
        onFiltersChange({ product: nextValue });
      }
    } catch (error) {
      // ignore storage errors
    }
  }, [filters.product, onFiltersChange, products]);

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
    }
    schedulePersist(() => {
      try {
        if (productSlug) {
          localStorage.setItem(STORAGE_KEY, productSlug);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        // ignore storage errors
      }
    });
  }, [productSlug]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    onFiltersChange({ [name]: value || undefined });
  };

  useEffect(() => {
    if (!filters.product) {
      return;
    }
    const normalized = toProductSlug(filters.product);
    const match = findProductBySlug(products, normalized);
    if (match && match !== filters.product) {
      onFiltersChange({ product: match });
    }
  }, [filters.product, onFiltersChange, products]);

  const uniqueTopProducts = useMemo(() => {
    const seen = new Set<string>();
    return topProducts.filter((product) => {
      if (seen.has(product.name)) {
        return false;
      }
      seen.add(product.name);
      return true;
    });
  }, [topProducts]);

  return (
    <div className="sticky top-20 z-10 space-y-3">
      {uniqueTopProducts.length > 0 && (
        <div className="rounded-lg border border-primary/20 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            <span>Top produits</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {uniqueTopProducts.map((product) => {
              const isActive = productSlug ? productSlug === toProductSlug(product.name) : false;
              return (
                <button
                  key={product.name}
                  type="button"
                  onClick={() => onFiltersChange({ product: isActive ? undefined : product.name })}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
                    isActive
                      ? 'border-primary bg-primary text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-primary hover:text-primary'
                  }`}
                >
                  <span className="font-medium">{product.name}</span>
                  <span className="text-xs opacity-80">{product.total.toLocaleString('fr-FR')} FCFA</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col text-xs font-medium uppercase text-slate-500">
            Date
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleChange}
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="flex flex-col text-xs font-medium uppercase text-slate-500">
            Ville
            <select
              name="city"
              value={filters.city ?? ''}
              onChange={handleChange}
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Toutes</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs font-medium uppercase text-slate-500">
            Adresse
            <input
              type="text"
              name="address"
              value={filters.address ?? ''}
              onChange={handleChange}
              placeholder="Rechercher..."
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="flex flex-col text-xs font-medium uppercase text-slate-500">
            Produit
            <div className="relative mt-1">
              <input
                type="text"
                name="product"
                list="product-options"
                value={filters.product ?? ''}
                onChange={handleChange}
                placeholder="Sélectionner un produit"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {filters.product && (
                <button
                  type="button"
                  onClick={() => onFiltersChange({ product: undefined })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <datalist id="product-options">
                {products.map((product) => (
                  <option key={product} value={product} />
                ))}
              </datalist>
            </div>
          </label>
          <label className="flex flex-col text-xs font-medium uppercase text-slate-500">
            Téléphone
            <input
              type="text"
              name="phone"
              value={filters.phone ?? ''}
              onChange={handleChange}
              placeholder="Téléphone"
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="flex flex-col text-xs font-medium uppercase text-slate-500 md:col-span-2 lg:col-span-4">
            Recherche globale
            <input
              type="text"
              name="search"
              value={filters.search ?? ''}
              onChange={handleChange}
              placeholder="Nom, adresse, produit, téléphone..."
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading || !connection?.sheetId}
            className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            Rafraîchir
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBarV2;
