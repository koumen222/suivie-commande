import { NavLink } from 'react-router-dom';
import { BarChart2, ListOrdered } from 'lucide-react';

const OrdersNavigation = () => {
  const getClasses = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-primary text-white shadow-sm'
        : 'text-slate-600 hover:bg-primary/10 hover:text-primary'
    }`;

  return (
    <nav className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm backdrop-blur">
      <NavLink to="/orders" className={getClasses} end>
        <ListOrdered className="h-4 w-4" />
        Commandes
      </NavLink>
      <NavLink to="/rapports" className={getClasses}>
        <BarChart2 className="h-4 w-4" />
        Rapports
      </NavLink>
    </nav>
  );
};

export default OrdersNavigation;
