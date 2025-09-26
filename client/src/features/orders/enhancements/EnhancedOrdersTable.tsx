import { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, Check, MoreHorizontal } from 'lucide-react';
import { Menu } from '@headlessui/react';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';
import OrdersTable from '../components/OrdersTable';
import { Order } from '../../../types/order';
import { formatOrderForZendo } from './formatZendo';

const copyToClipboard = async (value: string) => {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const result = document.execCommand('copy');
    document.body.removeChild(textarea);
    return result;
  } catch (error) {
    console.error('Clipboard copy failed', error);
    return false;
  }
};

type EnhancedOrdersTableProps = {
  orders: Order[];
  isLoading: boolean;
  onUpdate: (orderId: string, changes: Partial<Order>) => Promise<void>;
};

const RowActions = ({ onCopy }: { onCopy: () => void }) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary">
        Actions
        <MoreHorizontal className="h-4 w-4" />
      </Menu.Button>
      <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md border border-slate-200 bg-white p-1 shadow-lg focus:outline-none">
        <Menu.Item>
          {({ active }) => (
            <button
              type="button"
              onClick={onCopy}
              className={clsx(
                'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm',
                active ? 'bg-primary/10 text-primary' : 'text-slate-700'
              )}
            >
              <Copy className="h-4 w-4" />
              Copier Zendo
            </button>
          )}
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );
};

const EnhancedOrdersTable = ({ orders, isLoading, onUpdate }: EnhancedOrdersTableProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => orders.some((order) => order.id === id)));
  }, [orders]);

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedIds.includes(order.id)),
    [orders, selectedIds]
  );

  const handleSelectionChange = useCallback((orderId: string, next: boolean) => {
    setSelectedIds((current) => {
      if (next) {
        if (current.includes(orderId)) {
          return current;
        }
        return [...current, orderId];
      }
      return current.filter((id) => id !== orderId);
    });
  }, []);

  const handleToggleAll = useCallback(
    (selectAll: boolean) => {
      if (selectAll) {
        setSelectedIds(orders.map((order) => order.id));
      } else {
        setSelectedIds([]);
      }
    },
    [orders]
  );

  const handleCopy = useCallback(async (ordersToCopy: Order[]) => {
    if (!ordersToCopy.length) {
      return;
    }
    const content = ordersToCopy.map((order) => formatOrderForZendo(order)).join('\n\n');
    const success = await copyToClipboard(content);
    if (success) {
      toast.success('Copié au format Zendo ✅');
    } else {
      toast.error("Impossible de copier le texte");
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <OrdersTable
          orders={orders}
          isLoading={isLoading}
          onUpdate={onUpdate}
          enhancements={{
            selection: {
              selectedIds,
              onSelectOne: handleSelectionChange,
              onSelectAll: handleToggleAll
            },
            actions: (order) => <RowActions onCopy={() => handleCopy([order])} />
          }}
        />
      </div>
      {selectedOrders.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span>
              {selectedOrders.length} commande{selectedOrders.length > 1 ? 's' : ''} sélectionnée
              {selectedOrders.length > 1 ? 's' : ''}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(selectedOrders)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            <Copy className="h-4 w-4" />
            Copier Zendo ({selectedOrders.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default EnhancedOrdersTable;
