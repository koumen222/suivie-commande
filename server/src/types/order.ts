export type Order = {
  id: string;
  productName: string;
  productPrice: number;
  productQuantity: number;
  address1: string;
  city?: string;
  firstName: string;
  phone: string;
  productLink?: string;
  createdDate?: string;
  subtotal: number;
  derivedDate?: boolean;
};

export type SheetMethod = 'public-csv' | 'service-account';

export type SheetMeta = {
  sheetId: string;
  sheetName?: string;
  sheetRange?: string;
  method: SheetMethod;
  detectedHeaders: Record<string, string>;
  availableHeaders: string[];
  missingHeaders: string[];
  mapping: Record<string, string>;
  headers: string[];
};
