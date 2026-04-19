import { prisma } from "@/lib/prisma";

export async function getEngineSettings() {
  const row = await prisma.systemSettings.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  });
  return row;
}
