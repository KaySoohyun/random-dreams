import { randomUUID } from "node:crypto";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export async function cleanupOrder(orderId: string) {
  await pool.query('DELETE FROM "GenerationLog" WHERE "orderId" = $1', [orderId]);
  await pool.query('DELETE FROM "GeneratedResult" WHERE "orderId" = $1', [orderId]);
  await pool.query('DELETE FROM "FormSubmission" WHERE "orderId" = $1', [orderId]);
  await pool.query('DELETE FROM "Order" WHERE id = $1', [orderId]);
}

export function getAdminToken(): string {
  const token = process.env.ADMIN_TOKEN;
  if (!token) throw new Error("ADMIN_TOKEN no está definido (cargá .env)");
  return token;
}

export async function getFirstProduct() {
  const { rows } = await pool.query(
    'SELECT id, slug, name, "formSchema" AS "formSchema" FROM "Product" ORDER BY "createdAt" ASC LIMIT 1'
  );
  return rows[0] as { id: string; slug: string; name: string; formSchema: unknown } | undefined;
}

export async function createOrderForAdmin(productId: string) {
  const orderId = randomUUID();
  const formData = { motivo: "Prueba e2e admin" };
  const formId = randomUUID();
  const resultId = randomUUID();
  const log1Id = randomUUID();
  const log2Id = randomUUID();

  await pool.query(
    'INSERT INTO "Order" (id, "productId", "paymentStatus", "confirmedAt", "createdAt", "updatedAt") VALUES ($1, $2, \'APPROVED\', now(), now(), now())',
    [orderId, productId]
  );
  await pool.query(
    'INSERT INTO "FormSubmission" (id, "orderId", "formData", "createdAt") VALUES ($1, $2, $3::jsonb, now())',
    [formId, orderId, JSON.stringify(formData)]
  );
  await pool.query(
    'INSERT INTO "GeneratedResult" (id, "orderId", "productId", "aiRequestPayload", "aiResponseStatus", "error", "retryCount", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4::jsonb, \'ERROR\', $5, 1, now(), now())',
    [resultId, orderId, productId, JSON.stringify(formData), "Error simulado para el E2E"]
  );
  await pool.query(
    'INSERT INTO "GenerationLog" (id, "orderId", step, status, "durationMs", "createdAt") VALUES ($1, $2, \'GENERATE_TEXT\', \'FAILED\', 123, now())',
    [log1Id, orderId]
  );
  await pool.query(
    'INSERT INTO "GenerationLog" (id, "orderId", step, status, "createdAt") VALUES ($1, $2, \'MARK_COMPLETED\', \'RUNNING\', now())',
    [log2Id, orderId]
  );

  return { id: orderId };
}

export async function closePool() {
  await pool.end();
}
