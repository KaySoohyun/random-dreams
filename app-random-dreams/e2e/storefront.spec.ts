import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { cleanupOrder, getFirstProduct } from "./helpers/db";

test.describe.configure({ mode: "serial" });

type Field = {
  name: string;
  type: string;
  label?: string;
  options?: string[];
};

let orderId = "";

test.afterAll(async () => {
  if (orderId) await cleanupOrder(orderId);
});

test("flujo completo: catálogo → formulario → checkout → generación → descargas", async ({
  page
}) => {
  const product = await getFirstProduct();
  if (!product) throw new Error("BD sin productos; correr `npm run seed`");

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Realidades que no pasaron" })).toBeVisible();
  await expect(page.getByText(product.name).first()).toBeVisible();

  await page.goto(`/producto/${product.slug}`);
  await expect(page.getByRole("heading", { name: product.name })).toBeVisible();

  const fields = (product.formSchema as { fields?: Field[] }).fields ?? [];
  expect(fields.length).toBeGreaterThan(0);
  for (const field of fields) {
    if (field.type === "text") {
      await page.locator(`input[name="${field.name}"]`).fill("Sofía");
    } else if (field.type === "number") {
      await page.locator(`input[name="${field.name}"]`).fill("5");
    } else if (field.type === "select") {
      await page.locator(`select[name="${field.name}"]`).selectOption({ index: 1 });
    } else if (field.type === "multiselect") {
      const group = page.getByRole("group", { name: field.label });
      await group.getByRole("button").nth(0).click();
      await group.getByRole("button").nth(1).click();
    }
  }

  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/checkout\//);
  const checkoutMatch = page.url().match(/\/checkout\/([^/]+)/);
  if (!checkoutMatch) throw new Error("No se pudo leer el orderId del checkout");
  orderId = checkoutMatch[1];

  await expect(page.getByRole("heading", { name: "Confirmar tu creación" })).toBeVisible();
  await page.getByRole("button", { name: "Confirmar y generar" }).click();
  await expect(page).toHaveURL(new RegExp(`/generacion/${orderId}`));

  await expect(page.getByText("Completado")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/\[mock\] El texto no se generó/)).toBeVisible();
  await expect(page.getByAltText(/Imagen generada/)).toBeVisible();

  const [textDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("menuitem", { name: "Texto (.txt)" }).click()
  ]);
  expect(textDownload.suggestedFilename()).toMatch(
    new RegExp(`^${product.slug}-sofia-\\d{4}-\\d{2}-\\d{2}\\.txt$`)
  );
  const textPath = await textDownload.path();
  if (!textPath) throw new Error("No hay path para el .txt");
  expect(readFileSync(textPath, "utf8")).toContain("[mock]");

  const [imageDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("menuitem", { name: "Imagen" }).click()
  ]);
  expect(imageDownload.suggestedFilename()).toMatch(
    new RegExp(`^${product.slug}-sofia-\\d{4}-\\d{2}-\\d{2}\\.png$`)
  );
  const imagePath = await imageDownload.path();
  if (!imagePath) throw new Error("No hay path para la imagen");
  const imageBytes = readFileSync(imagePath);
  expect(imageBytes.length).toBeGreaterThan(0);
  expect(imageBytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
});

test("404 en producto inexistente", async ({ page }) => {
  const response = await page.goto("/producto/no-existe");
  expect(response?.status()).toBe(404);
});

test("404 en generación inexistente", async ({ page }) => {
  const response = await page.goto("/generacion/order-que-no-existe");
  expect(response?.status()).toBe(404);
});
