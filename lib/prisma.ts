import { PrismaClient } from '@prisma/client';

// Declaramos 'prisma' no escopo global para evitar
// múltiplas instâncias durante o 'hot-reload' no desenvolvimento.
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Criamos uma única instância do PrismaClient.
// Se 'globalThis.prisma' já existir, nós a usamos.
// Se não, criamos uma nova.
const prisma = globalThis.prisma || new PrismaClient();

// No ambiente de produção, não queremos que 'globalaThis.prisma'
// seja usado, então o definimos apenas em desenvolvimento.
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
