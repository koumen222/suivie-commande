import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import ordersRouter from './routes/orders';
import sheetsRouter from './routes/sheets';
import statsRouter from './routes/stats';

dotenv.config();

const app = express();

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

const port = process.env.PORT || 4000;

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Erreur interne du serveur' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
