// db.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Teste de conexão (equivalente ao getConnection do mysql2)
async function testConnection() {
  try {
    // consulta simples; se falhar, lança erro
    await prisma.$queryRaw`SELECT 1`;
    console.log('Conectado ao banco de dados PostgreSQL com sucesso (Prisma)!');
  } catch (err) {
    console.error('Erro de conexão com PostgreSQL:', err);
  }
}

// Encerrar corretamente ao finalizar o processo
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

testConnection();

module.exports = prisma;
