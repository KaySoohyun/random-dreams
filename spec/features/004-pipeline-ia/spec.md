# 004 · Pipeline de generación IA

**Estado:** propuesta

## Qué hace

- Instala **Inngest** (SDK + `@google/genai`; el `serve` de Next se importa de `inngest/next`, no existe `@inngest/next`).
- Migración **`add_generation_log`**: enums `PipelineStep` (`GENERATE_TEXT`, `GENERATE_IMAGE`, `UPLOAD_RESULT`, `MARK_COMPLETED`) y `PipelineStepStatus` (`RUNNING`, `SUCCESS`, `FAILED`) + modelo `GenerationLog` (append-only, `@@index([orderId, createdAt])`).
- **`lib/ai/`**: interfaces **`AIContentProvider`** (Gemini: genera el texto del producto **y compone el prompt de imagen**, opción A del contrato) e **`AIImageProvider`** (HF FLUX.1-schnell: genera el PNG 1024²). Implementaciones reales + **mocks deterministas** y fábrica que selecciona por `AI_MOCK` (requisito para CI y dev sin claves).
- **`inngest/`**: cliente, evento `order/confirmed` y la **función del pipeline** con 4 pasos (idempotente por `orderId`):
  1. `GENERATE_TEXT` (Gemini) — marca `PROCESSING`/`startedAt`, genera texto + prompt de imagen.
  2. `GENERATE_IMAGE` (HF) — genera el PNG.
  3. `UPLOAD_RESULT` — **en MVP persiste en Postgres** (`textContent` + `imageBytes`).
  4. `MARK_COMPLETED` — `COMPLETED` + `completedAt`.
  Cada paso escribe su `GenerationLog` (`RUNNING` → `SUCCESS`/`FAILED`).
- **Trigger**: al confirmar (transición real `PENDING → APPROVED`), `confirmOrder` pasa a devolver `{ order, transitioned }` y la acción dispara `order/confirmed` **solo cuando transicionó** (los re-confirm reutilizan el `GeneratedResult` sin re-disparar).
- **Errores**: transitorios (429, 5xx, timeout) → lanzar para que Inngest reintente con backoff; permanentes (plantilla sin placeholder, campos faltantes) → `ERROR` + `error` + log `FAILED`, sin reintento (el botón manual llega en 005).
- **Webhook** `app/api/inngest/route.ts` registrando la función.
- `.env.example`: `GEMINI_API_KEY`, `HF_TOKEN`, `AI_MOCK`, `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`.

## Por qué

Es el motor del producto: sin él el flujo termina en "confirmado". Además materializa el contrato de IA (v1.0) y la trazabilidad por `GenerationLog` exigida por las convenciones. Todo a través de interfaces: el dominio nunca se acopla a Gemini/HF (el spike 0.2 validará las claves reales al final).

## Criterios de aceptación

- [ ] Confirmar un pedido transiciona `PENDING → APPROVED` **y** dispara `order/confirmed`; un re-confirm no re-dispara el evento.
- [ ] El pipeline transiciona `QUEUED → PROCESSING → COMPLETED` y setea `completedAt` cuando todos los pasos tienen éxito; con errores permanentes queda `ERROR` + `error`.
- [ ] El resultado del MVP se persiste en `GeneratedResult` (`textContent` + `imageBytes`) en el paso `UPLOAD_RESULT`.
- [ ] Cada paso escribe su `GenerationLog` (`RUNNING`/`SUCCESS`/`FAILED`) con `payload`/`error`; los reintentos agregan filas, no actualizan.
- [ ] El pipeline es idempotente por `orderId`: re-ejecución con estado `COMPLETED` sale temprano sin duplicar resultado.
- [ ] Con `AI_MOCK=true` el pipeline corre end-to-end sin claves reales (mocks deterministas); los tests no llaman a Gemini/HF.
- [ ] La lógica de generación usa `AIContentProvider`/`AIImageProvider` (sin acoplamiento a proveedor concreto).
- [ ] `npm run lint`, `npm test` y `npm run build` pasan.

## Fuera de alcance

- **Página de resultado y polling** del estado — feature **005** (el stub de `/generacion` sigue leyendo el estado en cada request).
- **Reintento manual** desde el frontend — feature **005**.
- **`uploadResult` en Supabase Storage** — V1 (en MVP el paso persiste en Postgres; `StorageAsset` es V1).
- **Validar claves reales de Gemini/HF** — spike **0.2** (diferido al final; los proveedores reales quedan implementados contra el contrato).
