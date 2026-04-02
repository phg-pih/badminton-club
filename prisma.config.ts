import * as fs from "fs";
import * as path from "path";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const p = path.resolve(process.cwd(), file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnv();

import { defineConfig } from "prisma/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const tursoUrl = process.env.BCLB_TURSO_DATABASE_URL;
const tursoToken = process.env.BCLB_TURSO_AUTH_TOKEN;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Adapter used at runtime (app); migrate dev/deploy always uses local SQLite below
  adapter: tursoUrl?.startsWith("libsql://")
    ? () => new PrismaLibSql({ url: tursoUrl, authToken: tursoToken })
    : undefined,
  // Prisma CLI only supports file: URLs with sqlite provider
  datasource: {
    url: "file:./prisma/dev.db",
  },
});
