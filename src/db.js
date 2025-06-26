// src/db.js

const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

// Adicione o hook de desconexão aqui também para garantir o graceful shutdown
process.on('beforeExit', async () => {
  console.log('Desconectando Prisma do db.js...');
  await prisma.$disconnect();
  console.log('Prisma desconectado do db.js.');
});

module.exports = prisma; // Exporta a instância do PrismaClient