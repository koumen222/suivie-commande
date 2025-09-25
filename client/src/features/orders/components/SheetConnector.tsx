import { useForm } from 'react-hook-form';
import { useOrdersStore } from '../../../store/ordersStore';

const SheetConnector = ({
  onConnect,
  method
}: {
  onConnect: (url: string) => Promise<void>;
  method?: 'public-csv' | 'service-account';
}) => {
  const { register, handleSubmit, reset } = useForm<{ url: string }>({
    defaultValues: { url: '' }
  });
  const { isLoading } = useOrdersStore();

  const onSubmit = handleSubmit(async ({ url }) => {
    await onConnect(url);
    reset();
  });

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <input
        type="url"
        required
        placeholder="URL Google Sheet"
        className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        {...register('url')}
      />
      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isLoading}
      >
        {isLoading ? 'Connexion...' : 'Connecter'}
      </button>
      {method && (
        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
          Mode: {method === 'public-csv' ? 'Lecture seule' : 'Edition active'}
        </span>
      )}
    </form>
  );
};

export default SheetConnector;
