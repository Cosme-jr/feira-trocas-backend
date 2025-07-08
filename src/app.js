// src/app.js (Será server.js no futuro, mas por enquanto mantenha o nome atual)

import 'dotenv/config';
import express from 'express';
import cors from 'cors'; // Importe o CORS
import { routes } from './routes/index.js'; // Importe as rotas centralizadas

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors()); // Use o middleware CORS
app.use(express.json());

// Use as rotas centralizadas
app.use(routes); // Não precisa de prefixo aqui se as rotas já tiverem seus próprios prefixos definidos internamente

// Remova esta rota de teste se não for mais necessária
// app.get('/', (req, res) => {
//   res.send('Bem-vindo à API da Feira de Trocas Comunitária!');
// });

app.listen(PORT, () => {
  console.log(`Servidor rodando em: http://localhost:${PORT}`);
});