import { google } from 'googleapis';
import { parseCsvOrders } from '../utils/orders';
import { todayIso } from '../utils/time';

// Fonction utilitaire pour gérer les noms d'onglets avec espaces
const normalizeSheetRange = (range: string): string => {
  // Si le range contient un nom d'onglet avec espaces, ajouter des quotes
  const match = range.match(/^([^!]+)!(.+)$/);
  if (match) {
    const [, sheetName, cellRange] = match;
    // Si le nom de l'onglet contient des espaces et n'est pas déjà entre quotes
    if (sheetName.includes(' ') && !sheetName.startsWith("'") && !sheetName.endsWith("'")) {
      return `'${sheetName}'!${cellRange}`;
    }
  }
  return range;
};

// Fonction pour lister les onglets d'un Google Sheet
export const getSheetTabs = async (spreadsheetId: string): Promise<string[]> => {
  try {
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.get({
      spreadsheetId
    });
    
    const tabNames = response.data.sheets?.map(sheet => sheet.properties?.title || '') || [];
    console.log('[GOOGLE SHEETS] Tabs found =', tabNames);
    
    return tabNames;
  } catch (error: any) {
    console.error('Google Sheets error (get tabs):', error.message);
    throw new Error(`Erreur lors de la récupération des onglets: ${error.message}`);
  }
};

// Fonction pour valider et corriger un range
export const validateAndFixRange = async (spreadsheetId: string, range?: string): Promise<string> => {
  try {
    // Si pas de range défini, utiliser le premier onglet
    if (!range) {
      const tabs = await getSheetTabs(spreadsheetId);
      if (tabs.length === 0) {
        throw new Error('Aucun onglet trouvé dans la feuille de calcul');
      }
      const firstTab = tabs[0];
      const finalRange = `${firstTab}!A:Z`;
      console.log('[GOOGLE SHEETS] No range specified, using first tab:', finalRange);
      return finalRange;
    }

    // Extraire le nom de l'onglet du range
    const match = range.match(/^([^!]+)!(.+)$/);
    if (!match) {
      throw new Error(`Format de range invalide: ${range}. Utilisez "NomOnglet!A:Z"`);
    }

    const [, sheetName, cellRange] = match;
    const cleanSheetName = sheetName.replace(/^'|'$/g, ''); // Enlever les quotes existantes

    // Vérifier si l'onglet existe
    const tabs = await getSheetTabs(spreadsheetId);
    const tabExists = tabs.includes(cleanSheetName);

    if (!tabExists) {
      console.warn(`⚠️ Onglet "${cleanSheetName}" non trouvé. Onglets disponibles:`, tabs);
      if (tabs.length > 0) {
        const firstTab = tabs[0];
        const fallbackRange = `${firstTab}!A:Z`;
        console.warn(`   Utilisation du premier onglet: ${fallbackRange}`);
        return fallbackRange;
      } else {
        throw new Error('Aucun onglet valide trouvé');
      }
    }

    // Normaliser le range (ajouter quotes si nécessaire)
    const normalizedRange = normalizeSheetRange(range);
    console.log('[GOOGLE SHEETS] Using range =', normalizedRange);
    
    return normalizedRange;
  } catch (error: any) {
    console.error('Google Sheets error (validate range):', error.message);
    throw error;
  }
};

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
  try {
    const sheets = getSheetsClient();
    
    // Valider et corriger le range
    const finalRange = await validateAndFixRange(sheetId, range);
    
    console.log('[GOOGLE SHEETS] SpreadsheetId =', sheetId);
    console.log('[GOOGLE SHEETS] Using range =', finalRange);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: finalRange
    });
    
    const values = response.data.values ?? [];
    console.log('[GOOGLE SHEETS] First row:', values[0]);
    
    if (!values.length) {
      console.log('[GOOGLE SHEETS] No data found in range');
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
  } catch (error: any) {
    console.error('Google Sheets error:', error.message);
    
    // Messages d'erreur plus clairs
    if (error.message.includes('Unable to parse range')) {
      throw new Error(`Erreur de plage: "${range}". Vérifiez que le nom de l'onglet est correct (ex: "Sheet1!A:Z").`);
    }
    if (error.message.includes('The caller does not have permission')) {
      throw new Error('Permission refusée. Vérifiez que le service account a accès à la feuille de calcul.');
    }
    if (error.message.includes('Requested entity was not found')) {
      throw new Error('Feuille de calcul non trouvée. Vérifiez l\'ID de la feuille.');
    }
    if (error.message.includes('Invalid JSON payload')) {
      throw new Error('Clé privée mal formatée. Vérifiez la variable GOOGLE_PRIVATE_KEY.');
    }
    
    throw new Error(`Erreur Google Sheets: ${error.message}`);
  }
};

export const updateSheetRow = async (
  sheetId: string,
  range: string,
  rowNumber: number,
  headers: string[],
  row: Record<string, any>
) => {
  try {
    const sheets = getSheetsClient();
    
    // Valider et corriger le range
    const finalRange = await validateAndFixRange(sheetId, range);
    const targetRange = `${finalRange.split('!')[0]}!A${rowNumber}:Z${rowNumber}`;
    
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
  } catch (error: any) {
    console.error('Google Sheets update error:', error.message);
    throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
  }
};

// Fonction pour lire dynamiquement les données d'un Google Sheet
export const readDynamicSheet = async (
  spreadsheetId: string,
  range?: string
) => {
  try {
    const sheets = getSheetsClient();
    
    console.log('[GOOGLE SHEETS] SpreadsheetId =', spreadsheetId);
    
    // Si pas de range spécifié, lister les onglets et utiliser le premier
    let finalRange: string;
    if (!range) {
      const tabs = await getSheetTabs(spreadsheetId);
      if (tabs.length === 0) {
        throw new Error('Aucun onglet trouvé dans la feuille de calcul');
      }
      const firstTab = tabs[0];
      finalRange = `${firstTab}!A:Z`;
      console.log('[GOOGLE SHEETS] No range specified, using first tab:', finalRange);
    } else {
      // Valider et corriger le range fourni
      finalRange = await validateAndFixRange(spreadsheetId, range);
    }
    
    console.log('[GOOGLE SHEETS] Using range =', finalRange);
    
    // Lire les données
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: finalRange
    });
    
    const values = response.data.values ?? [];
    console.log('[GOOGLE SHEETS] First row:', values[0]);
    console.log('[GOOGLE SHEETS] Total rows:', values.length);
    
    return {
      ok: true,
      spreadsheetId,
      range: finalRange,
      rows: values.length,
      data: values
    };
  } catch (error: any) {
    console.error('Google Sheets read error:', error.message);
    
    // Messages d'erreur plus clairs
    if (error.message.includes('Unable to parse range')) {
      throw new Error(`Erreur de plage: "${range}". Vérifiez que le nom de l'onglet est correct.`);
    }
    if (error.message.includes('The caller does not have permission')) {
      throw new Error('Permission refusée. Vérifiez que le service account a accès à la feuille de calcul.');
    }
    if (error.message.includes('Requested entity was not found')) {
      throw new Error('Feuille de calcul non trouvée. Vérifiez l\'ID de la feuille.');
    }
    if (error.message.includes('Invalid JSON payload')) {
      throw new Error('Clé privée mal formatée. Vérifiez la variable GOOGLE_PRIVATE_KEY.');
    }
    
    throw new Error(`Erreur Google Sheets: ${error.message}`);
  }
};
