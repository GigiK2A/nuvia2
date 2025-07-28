import { Request, Response } from "express";
import { prisma } from "./lib/prisma";

export const getUserPreferences = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const prefs = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  res.json(prefs);
};

export const updateUserPreferences = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { firstName, lastName, language, aiStyle } = req.body;

  const prefs = await prisma.userPreferences.upsert({
    where: { userId },
    update: { firstName, lastName, language, aiStyle },
    create: { userId, firstName, lastName, language, aiStyle },
  });

  res.json(prefs);
};