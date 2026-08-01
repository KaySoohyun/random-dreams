# Cambios

Registro de cambios relevantes. Último primero.

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
