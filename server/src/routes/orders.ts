import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { fetchPublicCsvOrders } from '../services/publicCsvService';
import { fetchServiceAccountOrders, updateSheetRow } from '../services/googleSheetsService';
import { setOrdersCache, getOrdersCache, updateCachedOrder } from '../services/orderCache';
import { SheetMeta } from '../types/order';
import { computeSubtotal, normalizeNumber } from '../utils/normalization';
import { extractCity } from '../utils/city';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { sheetId, range, method, gid, mapping: mappingParam, csvUrl, sheetName } = req.query as Record<string, string>;
    if (!sheetId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'sheetId requis' });
    }

    let overrides: Record<string, string> | undefined;
    if (mappingParam) {
      try {
        overrides = JSON.parse(mappingParam) as Record<string, string>;
      } catch (error) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Paramètre de mapping invalide' });
      }
    }
    const resolvedMethod = (method as 'public-csv' | 'service-account') || 'service-account';
    const targetRange = range || process.env.SHEET_RANGE || 'Feuille1!A:Z';

    const result =
      resolvedMethod === 'public-csv'
        ? await fetchPublicCsvOrders(
            csvUrl || `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid ? `&gid=${gid}` : ''}`,
            overrides
          )
        : await fetchServiceAccountOrders(sheetId, targetRange, overrides);

    const meta: SheetMeta = {
      sheetId,
      sheetRange: targetRange,
      sheetName,
      method: resolvedMethod,
      detectedHeaders: result.mapping,
      availableHeaders: result.headers,
      missingHeaders: result.missing,
      mapping: result.mapping,
      headers: result.headers
    };

    setOrdersCache(sheetId, { orders: result.orders, rawRows: result.rawRows, meta });

    return res.json({ orders: result.orders, meta });
  } catch (error) {
    next(error);
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

    await updateSheetRow(sheetId, cache.meta.sheetRange || 'Feuille1!A:Z', rowNumber, cache.meta.headers, rowForSheet);
    updateCachedOrder(sheetId, req.params.rowId, updatedOrder);

    return res.json({ success: true, order: updatedOrder, message: 'Commande mise à jour avec succès' });
  } catch (error) {
    next(error);
  }
});

export default router;
