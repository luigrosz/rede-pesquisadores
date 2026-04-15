import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import pesquisador from './routes/pesquisador.js';
import auth from './routes/auth.js';
import mail from './routes/mail.js';
import './jobs/subscriptionReminder.js';

const app = express();
const port = 3000;

app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/auth', authLimiter);

app.use('/pesquisador', pesquisador);
app.use('/auth', auth);
app.use('/mail', mail);

app.listen(port, () => {
  console.log(`Express server listening at http://localhost`);
});
