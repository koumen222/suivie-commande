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

// Fonction pour extraire l'ID d'une URL Google Sheets
export const extractSpreadsheetId = (input: string): string | null => {
  // Si c'est déjà un ID (pas d'URL), le retourner tel quel
  if (!input.includes('docs.google.com')) {
    return input;
  }

  // Regex pour extraire l'ID depuis une URL Google Sheets
  const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
  const match = input.match(regex);
  
  if (match && match[1]) {
    return match[1];
  }
  
  return null;
};