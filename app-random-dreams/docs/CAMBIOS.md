# Cambios

Registro de cambios relevantes. Último primero.

## 2026-08-01 — Migración Inngest → Trigger.dev

**Qué cambió:**

- Se elimina **Inngest** (`inngest/`, `app/api/inngest/route.ts`, paquetes `inngest`/`inngest-cli`) y se sustituye por **Trigger.dev v4** (`@trigger.dev/sdk@^4.5.9`).
- Nueva carpeta `trigger/`: `pipeline.ts` (lógica de generación reutilizable: `runGenerationPipeline`, `runGenerationInline`, `runImageGenerationInline`), `tasks.ts` (task `generate-text` con reintentos `maxAttempts: 5`), `events.ts` (`sendOrderConfirmed` = `tasks.trigger("generate-text", { orderId })`) y `trigger.config.ts`.
- Las Server Actions (`features/checkout/actions.ts`, `features/result/actions.ts`, `features/admin/actions.ts`) encolan con `sendOrderConfirmed` y, si Trigger.dev no está configurado (la llamada falla), **caen al fallback inline** `runGenerationInline` → el flujo no se rompe.
- `playwright.config.ts`: se quita el dev server de Inngest (el e2e usa el fallback inline). Script nuevo `npm run trigger:dev`.
- `.env.example` y `docs/despliegue-mvp.md`: `INNGEST_*` reemplazadas por `TRIGGER_API_URL` / `TRIGGER_SECRET_KEY` / `TRIGGER_PROJECT_ID` / `TRIGGER_ENVIRONMENT_ID`.
- Tests actualizados a `@/trigger/pipeline` y a la nueva lógica de encolado + fallback.

**Pendiente:** crear el proyecto en Trigger.dev Cloud, configurar las env vars en Vercel, reemplazar `proj_RANDOM_DREAMS` en `trigger.config.ts` y desplegar las tasks.

## 2026-08-01 — Imagen opcional a demanda (2 pasos)

**Qué cambió:**

- La generación queda **en 2 pasos**: primero solo texto (síncrono al confirmar, igual que antes), y en la página de resultado el usuario puede elegir **"Generar imagen"** (`ImageGenerateForm` con `useActionState`).
- Nueva acción `generateImageAction` en `features/result/actions.ts` → `runImageGenerationInline` en `inngest/run-pipeline.ts`: reinterpola `aiPromptTemplate` con el `formData` guardado, genera la imagen (Hugging Face) y la persiste con `saveImage` (nueva en `lib/services/generation.ts`). Los errores se loguean en `GenerationLog` (`GENERATE_IMAGE`) y se muestran junto al botón sin tocar el estado del texto.
- La página de resultado muestra la imagen (y su descarga) **solo si ya fue generada**; mientras tanto ofrece el botón para generarla.

**Nota:** la imagen se genera síncrona dentro del Server Action; con proveedor real puede demorar. Si en Vercel choca con el timeout del serverless, habrá que moverlo a background (Inngest).

## 2026-08-01 — Generación síncrona solo texto (temporal)

**Motivo:** desbloquear el flujo real en producción mientras se resuelve el incidente de Inngest Cloud (ver `docs/incidente-inngest-produccion.md`).

**Qué cambió:**

- **Se desactiva Inngest temporalmente:** al confirmar el pedido (o reintentar), la generación corre **síncrona** en el Server Action (`runGenerationInline` en `inngest/run-with-errors.ts`) en vez de enviar el evento `order/confirmed`. `inngest/events.ts` y `inngest/pipeline.ts` se mantienen para restaurar Inngest luego.
- **Solo texto de Gemini:** el pipeline ya no genera imagen (`GENERATE_IMAGE` eliminado de `inngest/run-pipeline.ts`). `saveTextAndImage` → `saveText` (persiste `textContent` y limpia los campos de imagen).
- **La UI de resultado ya no muestra ni permite descargar la imagen:** `app/(store)/generacion/[orderId]/page.tsx` solo muestra/descarga el texto.

**Para restaurar la generación con imagen + Inngest:**

1. Volver a agregar el paso `GENERATE_IMAGE` en `inngest/run-pipeline.ts` usando `getImageProvider()` y `saveTextAndImage`.
2. Que `features/checkout/actions.ts`, `features/result/actions.ts` y `features/admin/actions.ts` vuelvan a enviar `sendOrderConfirmed` en vez de `runGenerationInline`.
3. Reagregar la vista y descarga de imagen en la página de generación.
4. Actualizar tests (unit, smoke y e2e) que hoy asumen solo texto.

## 2026-08-01 — Migración a Trigger.dev: texto + imagen en background (verificado en prod)

**Qué cambió:**

- **Inngest eliminado** (carpeta `inngest/`, `app/api/inngest/route.ts`); el pipeline asíncrono ahora vive en `trigger/` y se orquesta con **Trigger.dev Cloud** (proyecto `proj_nklaujzeaipgfjurhwqa`, env `prod`/`dev`).
- Task `generate-dream` (`trigger/tasks.ts`, retry maxAttempts 5): `runGenerationPipeline` corre **GENERATE_TEXT (Gemini) → UPLOAD_RESULT → GENERATE_IMAGE (Hugging Face) → MARK_COMPLETED**. Si la imagen falla, no rompe el pedido (queda COMPLETED con el texto y la página ofrece reintentar la imagen).
- Las Server Actions (`checkout`, `result`, `admin`) encolan con `sendOrderConfirmed` → `tasks.trigger("generate-dream", { orderId })`, con fallback inline si Trigger.dev no está configurado.
- UI de `/generacion/[orderId]` actualizada a "tu texto e imagen".
- `trigger.config.ts`: `project: "proj_nklaujzeaipgfjurhwqa"`, `dirs: ["./trigger"]`, `maxDuration: 3600`, retries globales. CLI `trigger.dev@^4.5.9` en devDependencies; script `npm run trigger:dev`.

**Verificado en producción (2026-08-01):**

- Deploy de la task `generate-dream` (v20260801.2) y de la app en Vercel (`npx vercel --prod`).
- Pedido real creado en la BD prod y task disparada vía MCP en env `prod` → run `run_06frrg7m6kikhjre3oam7n8f01` **completed** en ~1 minuto: texto de 4740 caracteres (`resultado.txt`) e imagen de 291 KB (`resultado.jpg`) persistidos, status `COMPLETED`, `paymentStatus APPROVED`.
- Se observó el reintento automático funcionando: un `GENERATE_TEXT` falló por timeout de Gemini (504) y Trigger.dev reintentó hasta éxito.

**Pendiente:** dejar documentado cómo desplegar tasks nuevas (`npx trigger.dev deploy`) y cómo configurar las env vars en el dashboard de Trigger.dev (ya están cargadas manualmente en prod y dev).

## 2026-08-01 — Correcciones de calidad (rama mejoras-codigo)

**Qué cambió:**

- **Bug de imagen corregido (stale read):** `saveText` ya no borra la imagen; el pipeline lee el estado al inicio y `generateImageStep` solo regenera si no hay imagen. Antes, re-ejecutar el pipeline sobre un pedido con imagen la perdía.
- **`enqueueGeneration` extraído:** el bloque `try { sendOrderConfirmed } catch { runGenerationInline }` estaba duplicado en las 3 Server Actions (checkout, result, admin); ahora vive en `trigger/events.ts`.
- **`generateImageStep` reusa `runStep`:** elimina la duplicación del logging RUNNING/SUCCESS/FAILED.
- **`messageOf` movido a `lib/utils/message.ts`** (compartido entre `pipeline.ts` y `tasks.ts`).
- **Retry unificado:** `maxAttempts: 5` ahora solo en `trigger.config.ts`; se quitó el override en `tasks.ts`.
- **Cache-Control en `/api/resultado`:** `no-store` al descargar; `private, max-age=3600` en vista previa (el resultado es inmutable tras COMPLETED).
- **Lint en 0 warnings:** `argsIgnorePattern: "^_"` en `eslint.config.mjs`, parámetros renombrados a `_`-prefixed y import redundante de `FormField` eliminado en `prisma/seed-data.ts`.
