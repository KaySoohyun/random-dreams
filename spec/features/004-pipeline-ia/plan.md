# 004 · Pipeline de generación IA — Plan

_Cómo se implementa lo descrito en `spec.md`. Respeta `constitution/` (tech-stack: Inngest, Gemini, Hugging Face, Prisma/Supabase), `docs/contrato-ia.md` (v1.0) y el módulo 0.4 (GeneratedResult, GenerationLog)._

## Enfoque

- **Funciones de background de Inngest**: la generación nunca es síncrona en el request. `confirmOrder` solo dispara el evento; la función ejecuta los pasos con `step.run` (snapshot → reintentos seguros e idempotentes).
- **Interfaces primero**: `lib/ai/` define `AIContentProvider` y `AIImageProvider`; las implementaciones reales son intercambiables y los mocks permiten CI/dev sin claves.
- **Estados y trazabilidad**: `GeneratedResult.aiResponseStatus` controla el flujo; cada paso escribe `GenerationLog` (append-only).

## Implementación

1. **Dependencias** — `npm i inngest @google/genai` (runtime). HF usa `fetch` directo (sin SDK). _(No existe `@inngest/next`: el `serve` de Next se importa de `inngest/next`.)_
2. **Migración `add_generation_log`** — enums `PipelineStep` (`GENERATE_TEXT`, `GENERATE_IMAGE`, `UPLOAD_RESULT`, `MARK_COMPLETED`) y `PipelineStepStatus` (`RUNNING`, `SUCCESS`, `FAILED`) + modelo `GenerationLog` (inmutable, `@@index([orderId, createdAt])`, `@@index([step])`) y relación `Order.generationLogs`. **Recordar `npx prisma generate` tras migrar** (Prisma 7).
3. **`lib/ai/types.ts`** — `GeneratedText { text; imagePrompt }`; `AIContentProvider.generate(input): Promise<GeneratedText>` (interpola `aiTextTemplate` → texto, y compone el prompt de imagen desde `aiPromptTemplate`, opción A del contrato); `AIImageProvider.generate(prompt): Promise<Buffer>` (PNG).
4. **Implementaciones** — `lib/ai/gemini.ts` (`@google/genai`, `gemini-flash-latest`, `GEMINI_API_KEY`, timeout 30 s vía `httpOptions.timeout`) y `lib/ai/huggingface.ts` (`POST router.huggingface.co/fal-ai/fal-ai/flux/schnell` con body `{ prompt }`, `Authorization: Bearer HF_TOKEN`, timeout 120 s; la respuesta es JSON con `images[0].url` que se descarga). Mocks en `lib/ai/mock.ts` (texto y PNG deterministas de 1×1). Fábrica `lib/ai/factory.ts` según `AI_MOCK`.
5. **`inngest/client.ts`** — `new Inngest({ id: "random-dreams" })`; **`inngest/events.ts`** — `eventType("order/confirmed", { schema: z.object({ orderId: z.string() }) })` + `sendOrderConfirmed(orderId)` (`orderConfirmedEvent.create({ orderId })`). El schema describe solo los `data` del evento (Inngest los envuelve).
6. **`inngest/pipeline.ts`** — Inngest v4: `createFunction(options, handler)` con `{ id, name, retries: 5, triggers: [orderConfirmedEvent] }`:
   - `step.run("load-order")` → orden + `GeneratedResult`; si no existe o está `COMPLETED`, salir temprano.
   - `step.run("mark-processing")` → `PROCESSING` + `startedAt`.
   - `step.run("generate-text")` → provider de contenido; log `RUNNING`/`SUCCESS`.
   - `step.run("generate-image")` → provider de imagen; log.
   - `step.run("upload-result")` → `textContent` + `imageBytes` en `GeneratedResult`; log.
   - `step.run("mark-completed")` → `COMPLETED` + `completedAt`; log.
   - `try/catch`: si el error es permanente (validación/interpolación) → `ERROR` + `error` + log `FAILED` y no relanzar; si es transitorio (429/5xx/timeout) → log `FAILED` y relanzar para que Inngest reintente.
7. **Servicio** — `lib/services/generation.ts`: `getOrderGeneration`, `setProcessing`, `saveTextAndImage`, `markCompleted`, `markError`, `logStep` (todas sobre Prisma, con tipos `Prisma.InputJsonValue`).
8. **Trigger** — `lib/services/orders.ts`: `confirmOrder` devuelve `{ order, transitioned }` (transicionó = era `PENDING`); `features/checkout/actions.ts` llama `sendOrderConfirmed(orderId)` **solo si** `transitioned`.
9. **Webhook** — `app/api/inngest/route.ts`: `serve({ client: inngest, functions: [generationPipeline] })` de **`inngest/next`** (exportar `GET`/`POST`/`PUT`).
10. **`.env.example`** — `GEMINI_API_KEY`, `GEMINI_MODEL`, `HF_TOKEN`, `AI_MOCK=true`, `INNGEST_DEV`, `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` (con comentarios).
11. **Tests** — `factory.test.ts` (mock vs real por env), `generation-service.test.ts` (mock prisma: estados/logs/persistencia), `run-pipeline.test.ts` (invocar el pipeline con un `step.run` falso que ejecuta sincrónico: transiciones, idempotencia, logs, persistencia), y actualizar `orders-service.test.ts` para `{ order, transitioned }`. Mocks de Gemini/HF siempre (nunca llamadas reales en CI).
12. **Validación** — lint + test + build; smoke test: crear orden → confirmar → ejecutar el pipeline directo con `AI_MOCK=true` (test de integración `scripts/smoke-pipeline.test.ts` con config dedicada) → verificar `COMPLETED` + `textContent`/`imageBytes` + logs; luego limpiar. Mover 004 a "Hecho" y documentar.

## Decisiones

- **`aiRequestPayload` no cambia en 004** — conserva el snapshot del `formData` creado en 003; la trazabilidad de prompts interpolados queda en los `payload` de los `GenerationLog` (resuelve el abierto 0.4 sin migrar datos).
- **`GENERATE_TEXT` = texto + prompt de imagen** — el enum del módulo 0.4 no tiene paso `composePrompt` separado; la opción A del contrato (Gemini compone el prompt) queda dentro de `AIContentProvider`, aislada para que el spike pueda pasar a opción B sin tocar el pipeline.
- **`UPLOAD_RESULT` escribe en Postgres en MVP** — mismo nombre de paso (traza estable), distinto destino: BD ahora, Supabase Storage en V1.
- **Disparo solo al transicionar** — `transitioned` evita re-dislipar eventos en re-confirmaciones; el estado ya quedó `APPROVED`.
- **`step.run` con snapshot** — los reintentos reutilizan resultados intermedios (idempotencia del pipeline por `orderId`).

## Riesgos

- **API de Inngest v4** — `createFunction(options, handler)` con `triggers` y `retries` como número; `serve` viene de `inngest/next` (el paquete `@inngest/next` no existe). Verificado contra los tipos instalados.
- **Modelo Gemini exacto** — spike 0.2: el free tier da 429 límite 0 para `gemini-2.0-flash` y 404 para `gemini-2.5-*`/`gemini-1.5-flash`; se usa `gemini-flash-latest` (override `GEMINI_MODEL`).
- **Reintento en `step.run` fallido** — Inngest reintenta pasos individuales; el guard de `COMPLETED` evita doble persistencia.
- **CLI de Inngest en dev** — el smoke test invoca el pipeline directo (sin depender de `inngest dev`); si el usuario quiere, se agrega `npx inngest dev` después.
