import { Router } from 'express';
import { parseSheetUrl, buildRangeFromSheetName, extractSpreadsheetId } from '../utils/gsheet';
import { readDynamicSheet } from '../services/googleSheetsService';
import { StatusCodes } from 'http-status-codes';

const router = Router();

router.post('/parse-link', (req, res) => {
  const { url } = req.body as { url?: string };
  if (!url) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'URL du Google Sheet manquante' });
  }

  const parsed = parseSheetUrl(url);
  if (!parsed) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'URL Google Sheet invalide' });
  }

  const sheetRange = process.env.SHEET_RANGE || buildRangeFromSheetName(parsed.sheetName) || 'Sheet1!A:Z';

  return res.json({
    sheetId: parsed.sheetId,
    sheetName: parsed.sheetName,
    sheetRange,
    method: parsed.method,
    gid: parsed.gid,
    csvUrl: parsed.csvUrl
  });
});

// Endpoint pour lister les onglets d'un Google Sheet
router.get('/tabs', async (req, res) => {
  try {
    const sheetId = req.query.sheetId as string;

    // Validation de l'ID de la feuille
    if (!sheetId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        ok: false,
        error: 'Paramètre sheetId requis'
      });
    }

    // Extraire l'ID depuis l'URL si nécessaire
    const extractedId = extractSpreadsheetId(sheetId);
    if (!extractedId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        ok: false,
        error: 'ID de feuille de calcul invalide. Fournissez un ID valide ou une URL Google Sheets complète.'
      });
    }

    console.log('[GOOGLE SHEETS] SpreadsheetId =', extractedId);

    // Créer le client Google Sheets
    const { google } = await import('googleapis');
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // Récupérer les métadonnées de la feuille
    const response = await sheets.spreadsheets.get({
      spreadsheetId: extractedId
    });

    const tabs = response.data.sheets?.map(sheet => sheet.properties?.title).filter(Boolean) || [];
    
    if (tabs.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        ok: false,
        error: 'Aucun onglet trouvé'
      });
    }

    console.log('[GOOGLE SHEETS] Tabs found =', tabs);

    return res.json({
      ok: true,
      tabs
    });
  } catch (error: any) {
    console.error('[SHEETS/TABS] Error:', error.message);
    
    // Gestion d'erreurs spécifiques Google Sheets
    if (error.code === 403) {
      return res.status(502).json({
        ok: false,
        error: 'Permission refusée. Vérifiez que le service account a accès à la feuille de calcul'
      });
    }
    
    if (error.code === 404) {
      return res.status(502).json({
        ok: false,
        error: 'Feuille de calcul non trouvée. Vérifiez l\'ID de la feuille'
      });
    }
    
    return res.status(502).json({
      ok: false,
      error: error.message || 'Erreur Google Sheets'
    });
  }
});

// Endpoint pour lire les données d'un Google Sheet
router.get('/read', async (req, res) => {
  try {
    const sheetId = req.query.sheetId as string;
    const tab = req.query.tab as string | undefined;

    // Validation de l'ID de la feuille
    if (!sheetId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        ok: false,
        error: 'Paramètre sheetId requis'
      });
    }

    // Extraire l'ID depuis l'URL si nécessaire
    const extractedId = extractSpreadsheetId(sheetId);
    if (!extractedId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        ok: false,
        error: 'ID de feuille de calcul invalide. Fournissez un ID valide ou une URL Google Sheets complète.'
      });
    }

    console.log('[GOOGLE SHEETS] SpreadsheetId =', extractedId);

    // Créer le client Google Sheets
    const { google } = await import('googleapis');
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
    const sheets = google.sheets({ version: 'v4', auth });

    let finalRange: string;

    if (!tab) {
      // Si pas d'onglet spécifié, lister les onglets et prendre le premier
      const response = await sheets.spreadsheets.get({
        spreadsheetId: extractedId
      });

      const tabs = response.data.sheets?.map(sheet => sheet.properties?.title).filter(Boolean) || [];
      
      if (tabs.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          ok: false,
          error: 'Aucun onglet trouvé'
        });
      }

      const firstTab = tabs[0];
      finalRange = `${firstTab.includes(' ') ? `'${firstTab}'` : firstTab}!A:Z`;
      console.log('[GOOGLE SHEETS] Tabs found =', tabs);
    } else {
      // Utiliser l'onglet spécifié
      finalRange = `${tab.includes(' ') ? `'${tab}'` : tab}!A:Z`;
    }

    console.log('[GOOGLE SHEETS] Using range =', finalRange);

    // Lire les données
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: extractedId,
      range: finalRange
    });

    const data = response.data.values || [];

    return res.json({
      ok: true,
      sheetId: extractedId,
      range: finalRange,
      rows: data.length,
      data
    });
  } catch (error: any) {
    console.error('[SHEETS/READ] Error:', error.message);
    
    // Gestion d'erreurs spécifiques Google Sheets
    if (error.code === 403) {
      return res.status(502).json({
        ok: false,
        error: 'Permission refusée. Vérifiez que le service account a accès à la feuille de calcul'
      });
    }
    
    if (error.code === 404) {
      return res.status(502).json({
        ok: false,
        error: 'Feuille de calcul non trouvée. Vérifiez l\'ID de la feuille'
      });
    }
    
    if (error.message?.includes('Unable to parse range')) {
      return res.status(502).json({
        ok: false,
        error: 'Range invalide. Vérifiez le nom de l\'onglet'
      });
    }
    
    return res.status(502).json({
      ok: false,
      error: error.message || 'Erreur Google Sheets'
    });
  }
});

// Nouvel endpoint pour lire dynamiquement un Google Sheet (POST - gardé pour compatibilité)
router.post('/read', async (req, res) => {
  try {
    const { spreadsheetId, range } = req.body as { 
      spreadsheetId?: string; 
      range?: string; 
    };

    // Validation de l'ID de la feuille
    if (!spreadsheetId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        ok: false,
        error: 'spreadsheetId est requis dans le body de la requête'
      });
    }

    // Extraire l'ID depuis l'URL si nécessaire
    const extractedId = extractSpreadsheetId(spreadsheetId);
    if (!extractedId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        ok: false,
        error: 'ID de feuille de calcul invalide. Fournissez un ID valide ou une URL Google Sheets complète.'
      });
    }

    // Lire les données de la feuille
    const result = await readDynamicSheet(extractedId, range);

    return res.json(result);
  } catch (error: any) {
    console.error('[SHEETS/READ] Error:', error.message);
    
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      ok: false,
      error: error.message
    });
  }
});

export default router;
