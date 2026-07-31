import { expect, test, type Page } from "@playwright/test";
import { cleanupOrder, getAdminToken, getFirstProduct, createOrderForAdmin } from "./helpers/db";

test.describe.configure({ mode: "serial" });

let adminOrderId = "";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.locator('input[name="token"]').fill(getAdminToken());
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.beforeAll(async () => {
  const product = await getFirstProduct();
  if (!product) throw new Error("BD sin productos; correr `npm run seed`");
  const order = await createOrderForAdmin(product.id);
  adminOrderId = order.id;
});

test.afterAll(async () => {
  if (adminOrderId) await cleanupOrder(adminOrderId);
});

test("sin sesión: /admin redirige a /admin/login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("login con token incorrecto muestra error", async ({ page }) => {
  await page.goto("/admin/login");
  await page.locator('input[name="token"]').fill("token-incorrecto");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByText("Token incorrecto.")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("login con token correcto abre el dashboard", async ({ page }) => {
  await login(page);
  await expect(page.getByText("Admin · Random Dreams")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Órdenes", exact: true })).toBeVisible();
});

test("ordenes: búsqueda por id y detalle con GenerationLog", async ({ page }) => {
  await login(page);
  await page.goto("/admin/ordenes");
  await page.locator('input[name="q"]').fill(adminOrderId);
  await page.getByRole("button", { name: "Filtrar" }).click();
  await expect(page.getByRole("link", { name: adminOrderId })).toBeVisible();

  await page.getByRole("link", { name: adminOrderId }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/ordenes/${adminOrderId}`));
  await expect(page.getByText("Error simulado para el E2E")).toBeVisible();
  await expect(page.getByText("Generar texto")).toBeVisible();
  await expect(page.getByText("Reintentar generación")).toBeVisible();
});

test("logout vuelve a /admin/login", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
});
