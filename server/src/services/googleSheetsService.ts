import { google } from 'googleapis';
import { parseCsvOrders } from '../utils/orders';
import { todayIso } from '../utils/time';

const getSheetsClient = () => {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Missing Google service account credentials');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  return google.sheets({ version: 'v4', auth });
};

export const fetchServiceAccountOrders = async (
  sheetId: string,
  range: string,
  overrides?: Record<string, string>
) => {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range
  });
  const values = response.data.values ?? [];
  if (!values.length) {
    return { orders: [], mapping: {}, missing: [], headers: [] };
  }
  const headers = values[0];
  const rows = values.slice(1);
  const csvRows = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',')
    )
  ].join('\n');
  const defaultDate = todayIso();
  return parseCsvOrders(csvRows, overrides, { defaultDate });
};

export const updateSheetRow = async (
  sheetId: string,
  range: string,
  rowNumber: number,
  headers: string[],
  row: Record<string, any>
) => {
  const sheets = getSheetsClient();
  const targetRange = `${range.split('!')[0]}!A${rowNumber}:Z${rowNumber}`;
  const rowValues = headers.map((header) => {
    const value = row[header];
    return value !== undefined ? String(value) : '';
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: targetRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [rowValues]
    }
  });
};
