import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { google } from 'googleapis';
import { getOrdersCache } from '../services/orderCache';
import { normalizeRange } from '../utils/sheetsRange';
import { extractSpreadsheetId } from '../utils/gsheet';

const router = Router();

const sameDay = (dateIso: string | undefined, target: string): boolean => {
  if (!dateIso) return false;
  return dateIso.startsWith(target);
};

router.get('/daily', async (req, res) => {
  try {
    const { sheetId, date, range } = req.query as Record<string, string>;

    // Validation des paramètres obligatoires
    if (!sheetId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        ok: false, 
        code: 'BAD_REQUEST',
        error: 'Paramètre sheetId requis' 
      });
    }

    if (!date) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        ok: false, 
        code: 'BAD_REQUEST',
        error: 'Paramètre date requis (YYYY-MM-DD)' 
      });
    }

    // Validation du format de date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        ok: false, 
        code: 'BAD_REQUEST',
        error: 'Format de date invalide. Utilisez YYYY-MM-DD' 
      });
    }

    // Extraire l'ID si l'utilisateur passe une URL complète
    const urlMatch = sheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const finalId = urlMatch ? urlMatch[1] : sheetId;

    // Validation de l'ID extrait
    if (!finalId || finalId.length < 10) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        ok: false,
        code: 'BAD_REQUEST',
        error: 'ID de feuille de calcul invalide'
      });
    }

    // Créer le client Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    try {
      // Utiliser l'utilitaire normalizeRange pour gérer automatiquement les ranges invalides
      const { finalRange, tabs } = await normalizeRange({
        sheets,
        spreadsheetId: finalId,
        requestedRange: range,
      });

      console.log('[GOOGLE SHEETS] SpreadsheetId =', finalId);
      console.log('[GOOGLE SHEETS] Tabs found =', tabs);
      console.log('[GOOGLE SHEETS] Using range =', finalRange);

      // Lire les données
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: finalId,
        range: finalRange
      });

      const data = response.data.values || [];
      
      if (data.length === 0) {
        return res.json({ 
          ok: true,
          totalSales: 0, 
          totalOrders: 0, 
          averageBasket: 0, 
          topProducts: [], 
          topCities: [],
          message: 'Aucune donnée trouvée pour cette date'
        });
      }

      // Traiter les données (supposons que la première ligne contient les en-têtes)
      const headers = data[0];
      const rows = data.slice(1);

      // Trouver les indices des colonnes pertinentes
      const dateIndex = headers.findIndex(h => h?.toString().toLowerCase().includes('date'));
      const productIndex = headers.findIndex(h => h?.toString().toLowerCase().includes('product'));
      const cityIndex = headers.findIndex(h => h?.toString().toLowerCase().includes('city'));
      const amountIndex = headers.findIndex(h => h?.toString().toLowerCase().includes('amount') || h?.toString().toLowerCase().includes('total'));

      // Filtrer les commandes du jour
      const orders = rows.filter(row => {
        if (dateIndex === -1) return false;
        const rowDate = row[dateIndex]?.toString();
        return rowDate && sameDay(rowDate, date);
      });

      // Calculer les statistiques
      const totalSales = orders.reduce((sum, order) => {
        if (amountIndex === -1) return sum;
        const amount = parseFloat(order[amountIndex]?.toString() || '0');
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

      const totalOrders = orders.length;
      const averageBasket = totalOrders ? Math.round(totalSales / totalOrders) : 0;

      // Top produits et villes
      const topProductsMap = new Map<string, number>();
      const topCitiesMap = new Map<string, number>();
      
      orders.forEach((order) => {
        if (productIndex !== -1 && amountIndex !== -1) {
          const product = order[productIndex]?.toString() || 'Inconnu';
          const amount = parseFloat(order[amountIndex]?.toString() || '0');
          topProductsMap.set(product, (topProductsMap.get(product) ?? 0) + amount);
        }
        if (cityIndex !== -1 && amountIndex !== -1) {
          const city = order[cityIndex]?.toString();
          if (city) {
            const amount = parseFloat(order[amountIndex]?.toString() || '0');
            topCitiesMap.set(city, (topCitiesMap.get(city) ?? 0) + amount);
          }
        }
      });

      const topProducts = Array.from(topProductsMap.entries())
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      const topCities = Array.from(topCitiesMap.entries())
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      return res.json({ 
        ok: true,
        totalSales, 
        totalOrders, 
        averageBasket, 
        topProducts, 
        topCities,
        date,
        range: finalRange
      });

    } catch (err: any) {
      console.error('Google Sheets error:', err?.message || err);
      
      // Gestion d'erreurs spécifiques Google Sheets
      if (err.code === 403) {
        return res.status(502).json({
          ok: false,
          code: 'GOOGLE_SHEETS_ERROR',
          error: 'Permission refusée. Vérifiez que le service account a accès à la feuille de calcul',
          details: { status: err.code }
        });
      }
      
      if (err.code === 404) {
        return res.status(502).json({
          ok: false,
          code: 'GOOGLE_SHEETS_ERROR',
          error: 'Feuille de calcul non trouvée. Vérifiez l\'ID de la feuille',
          details: { status: err.code }
        });
      }
      
      return res.status(502).json({
        ok: false,
        code: 'GOOGLE_SHEETS_ERROR',
        error: err?.message || 'Erreur Google Sheets',
        details: { status: err.code }
      });
    }
  } catch (error: any) {
    console.error('[STATS/DAILY] Error:', error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      ok: false, 
      code: 'INTERNAL_ERROR',
      error: error.message 
    });
  }
});

export default router;
