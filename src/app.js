// src/app.js

require('dotenv').config(); // Carrega as variáveis de ambiente do .env
const express = require('express');
const prisma = require('./db'); // <--- AGORA IMPORTA DE src/db.js

const app = express();
const PORT = process.env.PORT || 8080; // Define a porta, padrão 8080

// Middleware para parsear JSON no corpo das requisições
app.use(express.json());

// Rota de teste na raiz.
app.get('/', (req, res) => {
  res.send('Bem-vindo à API da Feira de Trocas Comunitária!');
});

// *************** LINHAS PARA AS ROTAS DE USUÁRIO ***************

// Importe as rotas de usuário.
const userRoutes = require('./routes/userRoutes');

// Use as rotas da API.
app.use('/api/users', userRoutes);

// ***************************************************************

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em: http://localhost:${PORT}`);
});

// O hook de desconexão foi movido para src/db.js,
// mas você pode manter um aqui se quiser que o app.js também participe,
// mas não é estritamente necessário para o Prisma em si.
// Para simplicidade, vamos removê-lo daqui.
/*
process.on('beforeExit', async () => {
  console.log('Desconectando Prisma...');
  await prisma.$disconnect();
  console.log('Prisma desconectado.');
});
*/

// O Prisma NÃO é mais exportado de app.js
// module.exports = prisma; // <--- REMOVA OU COMENTE ESTA LINHA!