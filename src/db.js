// src/db.js

import { PrismaClient } from '../generated/prisma/index.js'; // Ajuste o caminho se necessário

const prisma = new PrismaClient();

process.on('beforeExit', async () => { // <--- ESTA LINHA É CRÍTICA
  console.log('Desconectando Prisma do db.js...');
  await prisma.$disconnect();
  console.log('Prisma desconectado do db.js.');
});

export default prisma;