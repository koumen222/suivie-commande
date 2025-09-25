import { parse, Options } from 'csv-parse/sync';
import { Order } from '../types/order';
import { detectHeaders, HeaderMapping } from './mapping';
import { computeSubtotal, normalizeNumber } from './normalization';
import { extractCity } from './city';
import { zonedTimeToUtc } from './time';

export type ParsedOrdersResult = {
  orders: Order[];
  mapping: HeaderMapping;
  missing: string[];
  headers: string[];
  rawRows: Record<string, string>[];
};

const CSV_OPTIONS: Options = {
  columns: true,
  skip_empty_lines: true,
  trim: true
};

export const parseCsvOrders = (
  csvContent: string,
  overrides?: Record<string, string>,
  options: { defaultDate?: string } = {}
): ParsedOrdersResult => {
  const records = parse(csvContent, CSV_OPTIONS) as Record<string, string>[];
  const headers = records.length ? Object.keys(records[0]) : [];
  const { mapping, missing } = detectHeaders(headers, overrides);

  const orders: Order[] = records.map((row, index) => {
    const productName = row[mapping.productName] ?? '';
    const productPrice = normalizeNumber(row[mapping.productPrice]);
    const productQuantity = normalizeNumber(row[mapping.productQuantity] ?? '1');
    const address1 = row[mapping.address1] ?? '';
    const firstName = row[mapping.firstName] ?? '';
    const phone = row[mapping.phone] ?? '';
    const productLink = mapping.productLink ? row[mapping.productLink] : undefined;
    const createdRaw = mapping.createdDate ? row[mapping.createdDate] : undefined;

    let createdDate: string | undefined;
    let derivedDate = false;
    if (createdRaw) {
      createdDate = zonedTimeToUtc(createdRaw);
    }
    if (!createdDate && options.defaultDate) {
      createdDate = options.defaultDate;
      derivedDate = true;
    }

    const city = extractCity(address1);

    return {
      id: String(index + 2),
      productName,
      productPrice,
      productQuantity,
      address1,
      city,
      firstName,
      phone,
      productLink,
      createdDate,
      subtotal: computeSubtotal(productPrice, productQuantity),
      derivedDate
    };
  });

  return {
    orders,
    mapping,
    missing,
    headers,
    rawRows: records
  };
};
