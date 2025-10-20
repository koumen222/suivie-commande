import { Package } from 'lucide-react';

type TopProductsCardProps = {
  products: { name: string; total: number; quantity: number }[];
  isLoading: boolean;
};

const TopProductsCard = ({ products, isLoading }: TopProductsCardProps) => {
  const maxQuantity = Math.max(...products.map((product) => product.quantity || 0), 1);

  return (
    <div className="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold text-slate-800">Top produits</h3>
      </div>
      <p className="mt-1 text-sm text-slate-500">Classement basé sur les sous-totaux filtrés.</p>
      <div className="mt-4 space-y-3">
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded-md bg-slate-100" />
            ))}
          </div>
        )}
        {!isLoading && products.length === 0 && (
          <p className="text-sm text-slate-400">Aucun produit disponible pour les filtres sélectionnés.</p>
        )}
        {!isLoading &&
          products.map((product, index) => (
            <div key={product.name} className="rounded-md border border-slate-200 p-3">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>
                  #{index + 1} {product.name}
                </span>
                <span>{product.total.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max(10, Math.round((product.quantity / maxQuantity) * 100))}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">{product.quantity} unités vendues</p>
            </div>
          ))}
      </div>
    </div>
  );
};

export default TopProductsCard;
