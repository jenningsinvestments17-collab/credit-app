import { prisma } from "@/lib/db/prisma";

export async function getOrCreateIntakeForm(userId: string) {
  return prisma.intakeForm.upsert({
    where: { userId },
    update: {
      lastSavedAt: new Date(),
    },
    create: {
      userId,
      lastSavedAt: new Date(),
    },
  });
}

export async function updateIntakeForm(
  userId: string,
  data: Parameters<typeof prisma.intakeForm.update>[0]["data"],
) {
  await getOrCreateIntakeForm(userId);
  return prisma.intakeForm.update({
    where: { userId },
    data: {
      ...data,
      lastSavedAt: new Date(),
    },
  });
}

export async function getIntakeFormByUserId(userId: string) {
  return prisma.intakeForm.findUnique({
    where: { userId },
  });
}
