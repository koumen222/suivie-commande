import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { google } from 'googleapis';
import { fetchPublicCsvOrders } from '../services/publicCsvService';
import { fetchServiceAccountOrders, updateSheetRow } from '../services/googleSheetsService';
import { setOrdersCache, getOrdersCache, updateCachedOrder } from '../services/orderCache';
import { SheetMeta } from '../types/order';
import { computeSubtotal, normalizeNumber } from '../utils/normalization';
import { extractCity } from '../utils/city';
import { normalizeRange } from '../utils/sheetsRange';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const sheetId = req.query.sheetId as string;
    let range = req.query.range as string | undefined;

    // Validation stricte des entrées
    if (!sheetId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        ok: false, 
        code: 'BAD_REQUEST',
        error: 'Paramètre sheetId requis' 
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

      const resp = await sheets.spreadsheets.values.get({
        spreadsheetId: finalId,
        range: finalRange
      });

      // Convertir les données brutes en format attendu par le frontend
      const values = resp.data.values || [];
      if (values.length === 0) {
        return res.json({
          orders: [],
          meta: {
            method: 'service-account',
            sheetId: finalId,
            sheetRange: finalRange,
            detectedHeaders: {},
            missingHeaders: [],
            availableHeaders: []
          }
        });
      }

      // Supposer que la première ligne contient les en-têtes
      const headers = values[0];
      const rows = values.slice(1);

      // Créer un mapping des colonnes
      const detectedHeaders: Record<string, string> = {};
      headers.forEach((header: string, index: number) => {
        if (header) {
          detectedHeaders[header] = `col_${index}`;
        }
      });

      // Convertir les lignes en objets Order
      const orders = rows.map((row: any[], index: number) => {
        const order: any = {
          id: `order_${index + 1}`,
          productName: row[0] || '', // Product Name
          productPrice: parseFloat(row[1] || '0') || 0, // Product Price
          productQuantity: parseInt(row[2] || '1') || 1, // Product Quantity
          city: row[3] || '', // Ville
          firstName: row[4] || '', // First Name
          phone: row[5] || '', // Phone
          address1: row[6] || '', // Adresse
          createdDate: row[7] || new Date().toISOString().slice(0, 10), // DATE
          productLink: '', // Pas de colonne pour le lien produit
          subtotal: (parseFloat(row[1] || '0') || 0) * (parseInt(row[2] || '1') || 1),
          derivedDate: !row[7]
        };
        return order;
      });

      res.json({
        orders,
        meta: {
          method: 'service-account',
          sheetId: finalId,
          sheetRange: finalRange,
          detectedHeaders,
          missingHeaders: [],
          availableHeaders: headers.filter(Boolean)
        }
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
      
      if (err.message?.includes('Unable to parse range')) {
        return res.status(502).json({
          ok: false,
          code: 'GOOGLE_SHEETS_ERROR',
          error: 'Range invalide. Vérifiez le format du range',
          details: { status: err.code }
        });
      }
      
      // Erreur générique Google Sheets
      return res.status(502).json({
        ok: false,
        code: 'GOOGLE_SHEETS_ERROR',
        error: err?.message || 'Erreur Google Sheets',
        details: { status: err.code }
      });
    }
  } catch (error: any) {
    console.error('[ORDERS] Error:', error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      ok: false, 
      code: 'INTERNAL_ERROR',
      error: error.message 
    });
  }
});

router.put('/:rowId', async (req, res, next) => {
  try {
    const { sheetId } = req.query as Record<string, string>;
    if (!sheetId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'sheetId requis pour la mise à jour' });
    }

    const cache = getOrdersCache(sheetId);
    if (!cache) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Aucune donnée en cache pour ce sheet. Rechargez les commandes.' });
    }

    if (cache.meta.method === 'public-csv') {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: 'Ce sheet est en lecture seule. Configurez un compte de service pour activer les mises à jour.' });
    }

    const rowNumber = Number(req.params.rowId);
    if (Number.isNaN(rowNumber)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Identifiant de ligne invalide' });
    }

    const existingOrder = cache.orders.find((order) => order.id === req.params.rowId);
    if (!existingOrder) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Commande introuvable' });
    }

    const updates = req.body as Partial<typeof existingOrder>;
    const updatedOrder = {
      ...existingOrder,
      ...updates
    };
    if (updates.address1) {
      updatedOrder.address1 = updates.address1;
      updatedOrder.city = extractCity(updates.address1) ?? existingOrder.city;
    }
    if (updates.createdDate) {
      const parsedDate = new Date(updates.createdDate);
      if (!Number.isNaN(parsedDate.getTime())) {
        updatedOrder.createdDate = parsedDate.toISOString();
      }
    }
    if (updates.productPrice !== undefined || updates.productQuantity !== undefined) {
      const price = updates.productPrice !== undefined ? normalizeNumber(updates.productPrice) : existingOrder.productPrice;
      const quantity =
        updates.productQuantity !== undefined ? normalizeNumber(updates.productQuantity) : existingOrder.productQuantity;
      updatedOrder.productPrice = price;
      updatedOrder.productQuantity = quantity;
      updatedOrder.subtotal = computeSubtotal(price, quantity);
    }

    const index = Number(req.params.rowId) - 2;
    const rawRow = cache.rawRows[index];
    if (!rawRow) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Ligne introuvable dans le sheet' });
    }
    const rowForSheet: Record<string, string> = { ...rawRow };
    for (const [key, header] of Object.entries(cache.meta.mapping)) {
      if ((updates as any)[key] !== undefined) {
        rowForSheet[header] = String((updatedOrder as any)[key] ?? '');
      }
    }

    await updateSheetRow(sheetId, cache.meta.sheetRange || 'Sheet1!A:Z', rowNumber, cache.meta.headers, rowForSheet);
    updateCachedOrder(sheetId, req.params.rowId, updatedOrder);

    return res.json({ success: true, order: updatedOrder, message: 'Commande mise à jour avec succès' });
  } catch (error) {
    next(error);
  }
});

export default router;
