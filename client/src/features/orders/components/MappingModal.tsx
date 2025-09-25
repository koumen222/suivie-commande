import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';

const REQUIRED_FIELDS: Record<string, string> = {
  productName: 'Product Name',
  productPrice: 'Product Price',
  productQuantity: 'Product Quantity',
  address1: 'Address 1',
  firstName: 'First Name',
  phone: 'Phone',
  productLink: 'Product Link',
  createdDate: 'Created Date'
};

const MappingModal = ({
  isOpen,
  missing,
  available,
  onClose,
  onApply
}: {
  isOpen: boolean;
  missing: string[];
  available: string[];
  onClose: () => void;
  onApply: (mapping: Record<string, string>) => void;
}) => {
  const [localMapping, setLocalMapping] = useState<Record<string, string>>({});
  const canApply = missing.every((field) => Boolean(localMapping[field]));

  useEffect(() => {
    if (isOpen) {
      setLocalMapping({});
    }
  }, [isOpen]);

  const handleApply = () => {
    if (canApply) {
      onApply(localMapping);
      onClose();
    }
  };

  const handleChange = (field: string, value: string) => {
    setLocalMapping((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  Mapper les colonnes manquantes
                </Dialog.Title>
                <p className="mt-2 text-sm text-slate-600">
                  Nous n'avons pas trouvé certaines colonnes obligatoires. Associez-les manuellement ci-dessous.
                </p>
                <div className="mt-6 space-y-4">
                  {missing.map((field) => (
                    <div key={field} className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">{REQUIRED_FIELDS[field] ?? field}</label>
                      <Listbox value={localMapping[field]} onChange={(value) => handleChange(field, value)}>
                        <div className="relative mt-1">
                          <Listbox.Button className="relative w-full cursor-pointer rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 sm:text-sm">
                            <span className="block truncate">{localMapping[field] ?? 'Sélectionner une colonne'}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                            </span>
                          </Listbox.Button>
                          <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                              {available.map((option) => (
                                <Listbox.Option
                                  key={option}
                                  className={({ active }) =>
                                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                      active ? 'bg-primary/10 text-primary' : 'text-slate-900'
                                    }`
                                  }
                                  value={option}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{option}</span>
                                      {selected ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    onClick={onClose}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleApply}
                    disabled={!canApply}
                  >
                    Appliquer
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default MappingModal;
