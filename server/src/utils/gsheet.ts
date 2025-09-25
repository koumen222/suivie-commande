import { SheetMethod } from '../types/order';

export type ParsedSheetLink = {
  sheetId: string;
  sheetName?: string;
  gid?: string;
  csvUrl?: string;
  method: SheetMethod;
};

const SHEET_ID_REGEX = /spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
const GID_REGEX = /gid=([0-9]+)/;

export const parseSheetUrl = (url: string): ParsedSheetLink | null => {
  const sheetIdMatch = url.match(SHEET_ID_REGEX);
  if (!sheetIdMatch) {
    return null;
  }
  const sheetId = sheetIdMatch[1];
  const gidMatch = url.match(GID_REGEX);
  const gid = gidMatch ? gidMatch[1] : undefined;

  const isPublicCsv = /\/pub\?|\/pubhtml|output=csv|export\?format=csv/.test(url);
  const csvUrl = isPublicCsv
    ? url.includes('export?format=csv')
      ? url
      : `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid ? `&gid=${gid}` : ''}`
    : undefined;

  return {
    sheetId,
    gid,
    csvUrl,
    method: isPublicCsv ? 'public-csv' : 'service-account'
  };
};

export const buildRangeFromSheetName = (sheetName?: string): string | undefined => {
  if (!sheetName) {
    return undefined;
  }
  return `${sheetName}!A:Z`;
};
