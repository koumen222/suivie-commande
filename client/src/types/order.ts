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

export type OrdersMeta = {
  method: 'public-csv' | 'service-account';
  sheetId: string;
  sheetName?: string;
  sheetRange?: string;
  detectedHeaders: Record<string, string>;
  missingHeaders?: string[];
  availableHeaders?: string[];
};
