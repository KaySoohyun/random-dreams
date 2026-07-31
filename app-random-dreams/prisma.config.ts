import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migraciones/CLI: conexión directa (5432). Runtime usa DATABASE_URL (pooler 6543).
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
