import { prisma } from '../lib/prisma';

export const getUserPreferences = async (userId: string) => {
  return await prisma.userPreferences.findUnique({
    where: { userId },
  });
};

export const upsertUserPreferences = async (userId: string, data: any) => {
  return await prisma.userPreferences.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
};