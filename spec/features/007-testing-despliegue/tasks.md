# 007 · Testing y despliegue MVP — Tareas

- [x] `devDependencies`: `@playwright/test` e `inngest-cli`; script `test:e2e` en `package.json`.
- [x] `playwright.config.ts`: `testDir: "e2e/"`, un worker, Chromium, `baseURL`, `webServer` (Inngest Dev Server + Next dev), reporter html.
- [x] `npx playwright install chromium` (navegador) y `.gitignore`/`.vercelignore` para `test-results/` y `playwright-report/`.
- [x] `e2e/helpers/db.ts`: conexión `pg` directa (sin cliente generado), `cleanupOrder`, `createOrderForAdmin`, `getAdminToken`; `global-teardown.ts` cierra el pool.
- [x] `e2e/storefront.spec.ts` (serial): home → catálogo → ficha → formulario → checkout → confirmar → `/generacion/[orderId]` → `COMPLETED` (polling) → texto + preview → descargas `.txt`/imagen → 404s → limpieza `afterAll`.
- [x] `e2e/admin.spec.ts`: guard redirect, login ok/ko, dashboard, detalle con `GenerationLog`, logout.
- [x] Smoke integración IA: en modo real, aserción de texto > 40 chars e imagen > 1000 bytes (no triviales).
- [x] `.github/workflows/ci.yml`: jobs lint, unit, build, smoke, e2e (con secrets de GitHub documentados).
- [x] `.vercelignore` (sin `vercel.json`: Next 15 se auto-detecta).
- [x] `docs/despliegue-mvp.md` (pasos verificables + env vars) y `docs/qa-checklist-mvp.md`.
- [x] Correr `npm run lint`, `npm test`, `npm run build`, smoke (mock y **real**) y `npm run test:e2e` en verde.
- [x] Deploy efectivo: **preparado** (CI + docs); el paso manual queda documentado en `docs/despliegue-mvp.md` (no hay credenciales Vercel en el entorno).
- [x] Mover 007 a "Hecho" en `roadmap.md`, entrada en `docs/CAMBIOS.md`, nota en `docs/CONVENCIONES.md`, `[x]` en `spec.md` y `tasks.md`.
