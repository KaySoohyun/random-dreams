# 003 · Checkout sin pasarela — Tareas

_Checklist derivada de `plan.md`._

- [x] Migración `add_generated_result` (enum `AiResponseStatus` + modelo `GeneratedResult`).
- [x] `lib/services/orders.ts`: `confirmOrder` (transición `PENDING→APPROVED` + `confirmedAt` + upsert `GeneratedResult` QUEUED) y `getCheckoutOrder`.
- [x] `features/checkout/actions.ts`: `confirmOrder` (verifica estado + `redirect`).
- [x] Página `/checkout/[orderId]`: resumen data-driven + botón "Confirmar y generar"; ya confirmado → redirect; inexistente → 404.
- [x] Stub `/generacion/[orderId]`: lee `GeneratedResult` (404 si no existe) y muestra estado mínimo.
- [x] Tests del servicio (transición, idempotencia, `REJECTED`, upsert).
- [x] Correr `npm run lint`, `npm test` y `npm run build`.
- [x] Smoke test real del flujo (formulario → checkout → confirmar → generación).
- [x] Validar contra los criterios de aceptación de `spec.md`.
- [x] Mover 003 a "Hecho" en `../../constitution/roadmap.md` y actualizar documentación.

## Mantenimiento (checklist recurrente)

- [x] Si en el futuro la confirmación dispara Inngest (004), el trigger se suma en `confirmOrder` sin cambiar el servicio de estados.
