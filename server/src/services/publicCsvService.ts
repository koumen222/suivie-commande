import axios from 'axios';
import { parseCsvOrders } from '../utils/orders';
import { todayIso } from '../utils/time';

export const fetchPublicCsvOrders = async (
  url: string,
  overrides?: Record<string, string>
) => {
  const response = await axios.get<string>(url, { responseType: 'text' });
  const defaultDate = todayIso();
  return parseCsvOrders(response.data, overrides, { defaultDate });
};
