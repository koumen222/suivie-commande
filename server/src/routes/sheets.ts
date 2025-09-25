import { Router } from 'express';
import { parseSheetUrl, buildRangeFromSheetName } from '../utils/gsheet';
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

  const sheetRange = process.env.SHEET_RANGE || buildRangeFromSheetName(parsed.sheetName) || 'Feuille1!A:Z';

  return res.json({
    sheetId: parsed.sheetId,
    sheetName: parsed.sheetName,
    sheetRange,
    method: parsed.method,
    gid: parsed.gid,
    csvUrl: parsed.csvUrl
  });
});

export default router;
