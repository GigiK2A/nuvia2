import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;

// Initialize Prisma connection
export async function initializePrisma() {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected to PostgreSQL database');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    return false;
  }
}

// Graceful shutdown
export async function disconnectPrisma() {
  await prisma.$disconnect();
  console.log('🔌 Prisma disconnected from database');
}