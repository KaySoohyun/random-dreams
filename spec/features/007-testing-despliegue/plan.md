# 007 · Testing y despliegue MVP — Plan

_Cómo se implementa lo descrito en `spec.md`. Respeta `docs/CONVENCIONES.md` (Playwright para E2E, mocks de IA en CI, todo en español) y reutiliza la infra de smoke ya existente._

## Enfoque

- **E2E con procesos reales locales**: la app se levanta con `AI_MOCK=true` (pipeline deterministico, sin red externa de IA) pero con **Inngest Dev Server** real → el flujo completo es verdadero (evento → función → `COMPLETED`), no un mock de la aserción final.
- **Un solo worker y specs seriales** dentro de cada archivo: el flujo de storefront crea órdenes reales que el spec de admin reutiliza; limpieza en `afterAll`.
- **Capa de datos del E2E con su propio `PrismaClient`** (sin pasar por `lib/db/prisma` si hubiera `server-only`): el helper crea el cliente directamente con `@prisma/adapter-pg` para limpiar las órdenes de prueba.
- **Despliegue**: no se ejecuta el deploy sin credenciales; se entrega CI (GitHub Actions), `vercel.json` y documentación. El checklist QA es el "release gate" manual.

## Implementación

1. **Dependencias** — `devDependencies`: `@playwright/test`, `inngest-cli` (para el Dev Server local en E2E/CI). Scripts npm: `test:e2e` (`playwright test`).
2. **`playwright.config.ts`** — `testDir: "e2e/"`, `fullyParallel: false`, `workers: 1`, proyecto Chromium (`npx playwright install chromium` para el navegador), `baseURL: http://localhost:3000`, `reporter: [["list"], ["html", { open: "never" }]]`. `webServer`: dos entradas — Inngest Dev Server (`inngest-cli dev`, puerto 8288, con `reuseExistingServer`) y `next dev` (puerto 3000, `reuseExistingServer`). Si el arranque por array no es fiable, un script `scripts/e2e/servers.sh` que levanta ambos en orden y en background.
3. **Helper de datos** `e2e/helpers/db.ts` — `PrismaClient` propio (adapter pg + `DATABASE_URL`), funciones `cleanupOrder(orderId)` (borra `generationLog`, `generatedResult`, `formSubmission`, `order`) y `adminToken()` (lee `.env`).
4. **`e2e/storefront.spec.ts`** (serial):
   - Home → se ven los 6 productos → click al catálogo → ficha del primer producto.
   - Rellenar el formulario dinámico (seleccionar opciones según `type`), submit → redirect a `/checkout/[orderId]` → confirmar → redirect a `/generacion/[orderId]`.
   - Esperar `COMPLETED` (el polling auto-refresca; `expect.poll` con timeout ~30 s) → ver el texto generado y la imagen (`next/image`).
   - Descargar el `.txt` y la imagen (assert de `suggestedFilename` y contenido no vacío). Registrar `orderId` para `afterAll` (limpieza).
   - 404s: `/producto/no-existe` y `/generacion/inexistente`.
5. **`e2e/admin.spec.ts`** (serial): `/admin` → redirect a `/admin/login`; token malo → mensaje de error visible; token bueno → dashboard (header "Admin"); `/admin/ordenes` → abrir el detalle de la orden creada (id conocido vía `orderId`) → ver `GenerationLog`; logout → vuelve a `/admin/login`. Limpieza si crea datos.
6. **Smoke de integración IA** — en `scripts/smoke-pipeline.test.ts`, modo real: añadir aserción de que el texto generado contiene palabras/claves mínimas (no trivial) además del estado `COMPLETED`. En modo mock sigue siendo el texto fijo.
7. **CI** — `.github/workflows/ci.yml`: jobs `lint`, `unit` (`npm test`), `build`, `smoke` (con `AI_MOCK=true` y la BD de prueba en secret), `e2e` (instala Playwright + browsers, levanta los servidores, corre `test:e2e`). Env vars de `.env` como secrets de GitHub (documentadas en `docs/despliegue-mvp.md`).
8. **`vercel.json`** — si hace falta para Next 15/Turbopack (revisar; probablemente vacío), y `.vercelignore` para `e2e/`, `tests/`, `docs/`, `prototype/`.
9. **`docs/despliegue-mvp.md`** — pasos verificables: `git init` + repo GitHub, importar en Vercel, configurar env vars (todas las de `.env.example`, `AI_MOCK=false`, `ADMIN_TOKEN` de producción, `INNGEST_*` de Inngest Cloud), `prisma migrate deploy`, verificar `/admin`, redescarga y 404s en producción.
10. **`docs/qa-checklist-mvp.md`** — checklist manual pre-lanzamiento (flujo completo, admin, seguridad básica, rendimiento, mobile básico).
11. **Roadmap/docs** — mover 007 a "Hecho", entrada en `CAMBIOS.md`, nota en `CONVENCIONES.md` (script `test:e2e`), tachar `[x]` en `tasks.md` y `spec.md`.

## Decisiones

- **Inngest Dev Server real en E2E** (no mock de `sendOrderConfirmed`): el evento y la ejecución del pipeline son reales contra la app; con `AI_MOCK=true` la generación es rápida y determinista. Es la forma más fiel de "flujo completo" sin pagar llamadas de IA.
- **Playwright con workers=1 y specs seriales** — comparten la BD real y el orden importa (admin reutiliza la orden de storefront). Para CI, un job dedicado.
- **Helper DB propio del E2E** — evita acoplar la capa de datos del test a `server-only` y alias de imports; limpieza garantizada aunque falle un spec (`afterAll`).
- **El deploy se prepara, no se ejecuta sin credenciales** — CI + docs + checklist; el paso final es manual con la cuenta del usuario (se pregunta antes de intentarlo).

## Riesgos

- **Inngest CLI en CI/E2E** — descarga de binario grande al instalar; el `webServer` de Playwright debe esperar a que el Dev Server acepte eventos. Mitigación: script de arranque que hace poll del puerto 8288 y de `http://localhost:3000/api/inngest`.
- **E2E contra la BD real** — datos de prueba que puedan quedar si el proceso muere. Mitigación: `afterAll` de limpieza + ordenes identificables (se puede borrar por `orderId` conocido).
- **Flakiness del polling** — el timeout de `expect.poll` para `COMPLETED` con `AI_MOCK` es de decenas de segundos; la generación local es de ~1 s.
- **Turbopack en dev para E2E** — si `next dev --turbopack` da problemas con Playwright, el script de servidores puede usar `next dev` sin flag.
- **Inngest Dev Server y descubrimiento** — si el CLI no descubre `app/api/inngest`, levantar `inngest-cli dev` contra la URL del serve endpoint vía flag (`-u`).
