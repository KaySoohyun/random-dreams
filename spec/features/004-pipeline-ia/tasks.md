# 004 · Pipeline de generación IA — Tareas

_Checklist derivada de `plan.md`._

- [x] Instalar `inngest` y `@google/genai`. _(No existe `@inngest/next`; el `serve` de Next se importa de `inngest/next`.)_
- [x] Migración `add_generation_log` (enums `PipelineStep`/`PipelineStepStatus` + modelo `GenerationLog`) + `npx prisma generate`.
- [x] `lib/ai/`: tipos + interfaces `AIContentProvider`/`AIImageProvider`, implementaciones Gemini/HF, mocks y fábrica (`AI_MOCK`).
- [x] `inngest/client.ts` + `inngest/events.ts` (`eventType` + `sendOrderConfirmed`).
- [x] `inngest/pipeline.ts`: función `order/confirmed` (4 pasos, logs, estados, guard de idempotencia) + `run-with-errors.ts` (permanentes → `ERROR`/`NonRetriableError`; transitorios → rethrow).
- [x] `lib/services/generation.ts`: helpers de estado/logs/persistencia.
- [x] `confirmOrder` → `{ order, transitioned }`; la acción dispara el evento solo si transicionó.
- [x] `app/api/inngest/route.ts` (webhook `serve` de `inngest/next`).
- [x] `.env.example`: `GEMINI_API_KEY`, `GEMINI_MODEL`, `HF_TOKEN`, `AI_MOCK`, `INNGEST_DEV`, `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`.
- [x] Tests: fábrica, servicio de generación (mock prisma), pipeline (con `step.run` falso), `orders-service` actualizado.
- [x] Correr `npm run lint`, `npm test` y `npm run build`.
- [x] Smoke test: confirmar → pipeline (mock AI) → `COMPLETED` + resultado persistido + logs; datos limpiados.
- [x] Mover 004 a "Hecho" en `../../constitution/roadmap.md` y actualizar documentación.

## Mantenimiento (checklist recurrente)

- [ ] Al cambiar de proveedor/modelo: actualizar solo `lib/ai/` (nunca el pipeline ni el dominio).
- [ ] Si el spike 0.2 valida la opción B de prompt de imagen, el cambio vive dentro de `AIContentProvider`.
