import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable
} from '@tanstack/react-table';
import { useMemo, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Order } from '../../../types/order';
import { useOrdersStore } from '../../../store/ordersStore';
import { PencilIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { normalizeNumber } from '../../../utils/number';
import { extractCity } from '../../../utils/extractCity';

const editableColumns = new Set([
  'productName',
  'productPrice',
  'productQuantity',
  'address1',
  'firstName',
  'phone',
  'productLink',
  'createdDate'
]);

const formatCurrency = (value: number) => `${value.toLocaleString('fr-FR')} FCFA`;

const OrdersTable = ({
  orders,
  isLoading,
  onUpdate
}: {
  orders: Order[];
  isLoading: boolean;
  onUpdate: (orderId: string, changes: Partial<Order>) => Promise<void>;
}) => {
  const { sorts, setSorts, isSaving } = useOrdersStore();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);

  const buildChanges = useCallback((order: Order, columnId: string, rawValue: string): Partial<Order> => {
    const next: Partial<Order> = {};
    switch (columnId) {
      case 'productPrice': {
        const price = normalizeNumber(rawValue);
        if (!Number.isNaN(price)) {
          next.productPrice = price;
          next.subtotal = price * order.productQuantity;
        }
        break;
      }
      case 'productQuantity': {
        const quantity = normalizeNumber(rawValue);
        if (!Number.isNaN(quantity)) {
          next.productQuantity = quantity;
          next.subtotal = quantity * order.productPrice;
        }
        break;
      }
      case 'address1': {
        next.address1 = rawValue;
        next.city = extractCity(rawValue) ?? order.city;
        break;
      }
      case 'createdDate': {
        next.createdDate = rawValue ? new Date(rawValue).toISOString() : undefined;
        break;
      }
      default:
        (next as any)[columnId] = rawValue;
        break;
    }
    return next;
  }, []);

  const renderEditableCell = useCallback(
    (value: string | number | undefined, order: Order, columnId: string, displayValue?: string) => {
      const isEditing = editingCell?.rowId === order.id && editingCell?.columnId === columnId;
      const saving = isSaving[order.id];
      const isEditable = editableColumns.has(columnId);

      if (!isEditable) {
        return <span>{value ?? '—'}</span>;
      }

      const handleSave = async (nextValue: string) => {
        if (nextValue === String(value ?? '')) {
          setEditingCell(null);
          return;
        }
        const changes = buildChanges(order, columnId, nextValue);
        await onUpdate(order.id, changes);
        setEditingCell(null);
      };

      if (!isEditing) {
        const content = displayValue ?? String(value ?? '—');
        return (
          <button
            type="button"
            className="group inline-flex w-full items-center gap-2 text-left text-sm text-slate-700"
            onClick={() => setEditingCell({ rowId: order.id, columnId })}
          >
            <span className="flex-1 truncate">{content}</span>
            <PencilIcon className="h-4 w-4 text-slate-300 transition group-hover:text-primary" />
          </button>
        );
      }

      return (
        <input
          autoFocus
          type={columnId === 'productPrice' || columnId === 'productQuantity' ? 'number' : 'text'}
          defaultValue={columnId === 'createdDate' && value ? new Date(String(value)).toISOString().slice(0, 10) : String(value ?? '')}
          onBlur={(event) => handleSave(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void handleSave((event.target as HTMLInputElement).value);
            }
          }}
          className={clsx(
            'w-full rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50',
            saving ? 'border-slate-300 bg-slate-100 text-slate-400' : 'border-primary/40 bg-white'
          )}
          disabled={saving}
        />
      );
    },
    [buildChanges, editingCell, isSaving, onUpdate]
  );

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        header: 'Product Name',
        accessorKey: 'productName',
        cell: (info) => renderEditableCell(info.row.original.productName, info.row.original, 'productName')
      },
      {
        header: 'Product Price',
        accessorKey: 'productPrice',
        cell: (info) =>
          renderEditableCell(
            info.row.original.productPrice,
            info.row.original,
            'productPrice',
            formatCurrency(info.row.original.productPrice)
          )
      },
      {
        header: 'Product Quantity',
        accessorKey: 'productQuantity',
        cell: (info) => renderEditableCell(info.row.original.productQuantity, info.row.original, 'productQuantity')
      },
      {
        header: 'Ville',
        accessorKey: 'city',
        cell: (info) => info.row.original.city || '-'
      },
      {
        header: 'First Name',
        accessorKey: 'firstName',
        cell: (info) => renderEditableCell(info.row.original.firstName, info.row.original, 'firstName')
      },
      {
        header: 'Phone',
        accessorKey: 'phone',
        cell: (info) => renderEditableCell(info.row.original.phone, info.row.original, 'phone')
      },
      {
        header: 'Adresse',
        accessorKey: 'address1',
        cell: (info) => (
          <div className="max-w-xs">
            {renderEditableCell(info.row.original.address1, info.row.original, 'address1')}
          </div>
        )
      },
      {
        header: 'DATE',
        accessorKey: 'createdDate',
        cell: (info) =>
          renderEditableCell(
            info.row.original.createdDate,
            info.row.original,
            'createdDate',
            info.row.original.createdDate ? format(new Date(info.row.original.createdDate), 'dd/MM/yyyy HH:mm') : '—'
          )
      },
      {
        header: 'Lien',
        accessorKey: 'productLink',
        cell: (info) =>
          info.row.original.productLink ? (
            <a
              href={info.row.original.productLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              Ouvrir
            </a>
          ) : (
            renderEditableCell(info.row.original.productLink, info.row.original, 'productLink')
          )
      }
    ],
    [renderEditableCell]
  );

  const table = useReactTable({
    data: orders,
    columns,
    state: {
      sorting: sorts as SortingState,
      pagination
    },
    onSortingChange: (updater) => {
      const nextSorting = updater instanceof Function ? updater(sorts as SortingState) : updater;
      setSorts(nextSorting);
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
    manualSorting: false,
    autoResetPageIndex: false
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="cursor-pointer px-3 py-2 text-left font-medium uppercase tracking-wide text-slate-500"
                >
                  <div className="flex items-center gap-2">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{ asc: '↑', desc: '↓' }[header.column.getIsSorted() as string] ?? null}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-3 align-top">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {isLoading && <p className="py-4 text-center text-sm text-slate-400">Chargement...</p>}
      {!isLoading && !orders.length && <p className="py-4 text-center text-sm text-slate-400">Aucune commande</p>}
      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <div>
          Page {pagination.pageIndex + 1} sur {table.getPageCount() || 1}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-md border border-slate-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Précédent
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-md border border-slate-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrdersTable;
