import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import express from 'express';

const app = express();

// Permet d'avoir __dirname en mode ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cherche d'abord un .env dans /server puis à la racine
const serverEnv = path.resolve(__dirname, '../.env');
const rootEnv = path.resolve(__dirname, '../../.env');
if (!dotenv.config({ path: serverEnv }).parsed) {
  dotenv.config({ path: rootEnv });
}

// Répare la clé privée si présente
if (process.env.GOOGLE_PRIVATE_KEY) {
  process.env.GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
}

// Debug rapide
console.log('[ENV] GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL ? 'OK' : 'MISSING');
console.log('[ENV] GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? 'OK' : 'MISSING');
console.log('[ENV] Mode: Lecture dynamique (pas de SPREADSHEET_ID requis)');

// Endpoint test
app.get('/healthz', (_req, res) => {
  res.json({
    ok: true,
    email: !!process.env.GOOGLE_CLIENT_EMAIL,
    port: process.env.PORT || 4000
  });
});

// Endpoint de health
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    port: process.env.PORT || 4000,
    timestamp: new Date().toISOString()
  });
});

// Endpoint de debug (sans secrets)
app.get('/api/debug/env', (_req, res) => {
  res.json({
    ok: true,
    hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
    hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
    port: process.env.PORT || 4000
  });
});

// Endpoint de test Google Sheets
app.get('/test-sheets', async (_req, res) => {
  try {
    const { getSheetTabs, validateAndFixRange } = await import('./services/googleSheetsService');
    
    if (!process.env.SPREADSHEET_ID) {
      return res.status(400).json({
        ok: false,
        error: 'SPREADSHEET_ID requis dans .env'
      });
    }

    console.log('[TEST] Testing Google Sheets connection...');
    console.log('[TEST] SpreadsheetId =', process.env.SPREADSHEET_ID);
    
    // Lister les onglets disponibles
    const tabs = await getSheetTabs(process.env.SPREADSHEET_ID);
    
    // Valider et corriger le range
    const finalRange = await validateAndFixRange(process.env.SPREADSHEET_ID, process.env.SHEET_RANGE);
    
    // Tester la lecture des données
    const { google } = await import('googleapis');
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: finalRange
    });
    
    console.log('[TEST] First row:', response.data.values?.[0]);
    
    res.json({
      ok: true,
      spreadsheetId: process.env.SPREADSHEET_ID,
      originalRange: process.env.SHEET_RANGE,
      finalRange,
      availableTabs: tabs,
      firstRow: response.data.values?.[0],
      totalRows: response.data.values?.length || 0
    });
  } catch (error: any) {
    console.error('[TEST] Google Sheets error:', error.message);
    res.status(500).json({
      ok: false,
      error: error.message,
      details: 'Vérifiez vos credentials et que la feuille est partagée avec le service account'
    });
  }
});

import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { google } from 'googleapis';
import ordersRouter from './routes/orders';
import sheetsRouter from './routes/sheets';
import statsRouter from './routes/stats';

// Middleware de logs minimal
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] ${req.method} ${req.path}`, {
    query: req.query,
    body: req.method === 'POST' ? '[BODY]' : undefined
  });
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60
});
app.use('/api/orders/:rowId', limiter);

app.use('/api/sheets', sheetsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/stats', statsRouter);

// Port avec fallback si déjà occupé
function startServer(port: number) {
  const server = app.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.warn(`⚠️ Port ${port} occupé. Essai sur ${nextPort}...`);
      startServer(nextPort);
    } else {
      console.error('❌ Server error:', err);
      process.exit(1);
    }
  });
}

// Handler d'erreurs global
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API ERROR]', err);
  
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    ok: false,
    code: err.code || 'INTERNAL_ERROR',
    error: err.message || 'Erreur interne du serveur',
    ...(isDevelopment && { stack: err.stack })
  });
});

startServer(Number(process.env.PORT) || 4000);
