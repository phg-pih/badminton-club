import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

function createPrismaClient() {
  const url = process.env.BCLB_TURSO_DATABASE_URL ?? "file:./prisma/dev.db";
  const authToken = process.env.BCLB_TURSO_AUTH_TOKEN;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaLibSql({ url, authToken } as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
