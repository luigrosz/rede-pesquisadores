import express from 'express';
import cors from 'cors';
import pesquisador from './routes/pesquisador.js';
import auth from './routes/auth.js';

const app = express();
const port = 3000;

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());
app.use('/pesquisador', pesquisador);
app.use('/auth', auth);

app.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`);
});
