import { expect, it } from "vitest";
import { signSession, verifyAdminToken, verifySession } from "@/lib/admin/token";
import { prisma } from "@/lib/db/prisma";
import { listOrders } from "@/lib/services/admin";

it("smoke: panel admin — token real, sesión firmada y consultas con BD limpia", async () => {
  const token = process.env.ADMIN_TOKEN;
  if (!token) throw new Error("ADMIN_TOKEN no configurado en .env");

  expect(verifyAdminToken(token)).toBe(true);
  expect(verifyAdminToken("token-incorrecto")).toBe(false);

  const value = signSession(token, 12 * 60 * 60 * 1000);
  expect(verifySession(value, token)).toBe(true);
  expect(verifySession(value, token, Date.now() + 13 * 60 * 60 * 1000)).toBe(false);

  const { orders, total } = await listOrders({});
  expect(Array.isArray(orders)).toBe(true);
  expect(total).toBe(0);
  console.log("ADMIN_TOKEN ok · sesión ok · órdenes en BD:", total);

  await prisma.$disconnect();
});
