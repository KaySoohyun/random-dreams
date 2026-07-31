import { config as loadEnv } from "dotenv";
loadEnv();
import { prisma } from "@/lib/db/prisma";
try {
  const n = await prisma.product.count();
  console.log("product count:", n);
} catch (e: unknown) {
  console.log("prisma falla:", (e as Error).message);
}
