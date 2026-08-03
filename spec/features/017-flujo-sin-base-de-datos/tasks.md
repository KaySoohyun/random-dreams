# 017 · Flujo sin base de datos — Tasks

**Estado:** implementada

- [x] **1. Catálogo estático**
  - [x] 1.1 Crear `lib/data/products.ts` con tipo `CatalogProduct` y los 6 productos (reuso de `prisma/seed-data.ts`), `id = slug`.
  - [x] 1.2 Reescribir `lib/services/products.ts` para leer del catálogo estático (mismas firmas `getProducts`/`getProductBySlug`/`getProductById`).
- [x] **2. Store en memoria**
  - [x] 2.1 Crear `lib/store/orders.ts` con el Map global tipado, TTL por estado y limpieza.
  - [x] 2.2 Implementar operaciones de pedido (`createPendingOrder`, `getCheckoutOrder`, `getOrderById`, `getOrderGeneration`, `getOrderForGeneration`, `confirmOrder`).
  - [x] 2.3 Implementar operaciones de resultado (`setProcessing`, `saveText`, `saveImage`, `markCompleted`, `markError`, `retryGeneration`, `getResultText`, `getResultFile`, `logStep`).
  - [x] 2.4 Resolver `product` desde el catálogo para que los objetos devueltos sigan teniendo `.product`/`.formSubmission`/`.generatedResult`.
- [x] **3. Servicios**
  - [x] 3.1 Reescribir `lib/services/orders.ts` delegando en el store.
  - [x] 3.2 Reescribir `lib/services/generation.ts` delegando en el store.
- [x] **4. Encolado**
  - [x] 4.1 `trigger/events.ts`: `enqueueGeneration` hace fire-and-forget de `runGenerationInline` (sin Trigger.dev).
- [x] **5. Tests**
  - [x] 5.1 Reescribir `tests/unit/orders-service.test.ts` para el store en memoria.
  - [x] 5.2 Reescribir `tests/unit/generation-service.test.ts` para el store en memoria.
  - [x] 5.3 Revisar `scripts/smoke-pipeline.test.ts` y `scripts/smoke-admin.test.ts`.
- [x] **6. Verificación**
  - [x] 6.1 `npm test`, `npm run lint`, `npm run build` OK.
  - [x] 6.2 Prueba manual del flujo completo en `next dev` sin BD disponible.
  - [x] 6.3 Documentar en `docs/CAMBIOS.md` y actualizar `roadmap.md` (mover 017 a Hecho).
- [x] **7. Mensaje para pedido no persistente**
  - [x] 7.1 Crear `features/result/order-not-found.tsx` ("Este pedido ya fue triturado" + botón "Ir al catálogo").
  - [x] 7.2 Reemplazar `notFound()` en `/generacion/[orderId]` y `/checkout/[orderId]` por el mensaje amigable.
  - [x] 7.3 Actualizar e2e: `/generacion/order-que-no-existe` ya no es 404, muestra el aviso.
- [x] **8. Recuperación entre instancias (cookie firmada)**
  - [x] 8.1 Crear `lib/store/order-cookie.ts`: cookie `rd_order_<id>` firmada con HMAC-SHA256 (`ORDER_COOKIE_SECRET`), sin `result.imageBytes` (y sin `textContent` si excede ~3.5 KB).
  - [x] 8.2 `lib/services/orders.ts`: `createPendingOrder` async que escribe la cookie; getters hidratan desde la cookie si el store no tiene el pedido; `confirmOrder` re-escribe la cookie; nuevo `syncOrderCookie`.
  - [x] 8.3 Actualizar `tests/unit/orders-service.test.ts` (funciones async) y documentar en `docs/CAMBIOS.md`.
  - [ ] 8.4 Definir `ORDER_COOKIE_SECRET` en Vercel (Settings → Environment Variables).
