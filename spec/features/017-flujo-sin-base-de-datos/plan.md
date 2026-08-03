# 017 · Flujo sin base de datos — Plan

**Estado:** propuesta

## Contexto

Hoy el flujo del usuario lee/escribe en Postgres (Supabase, ca-central-1) en cada paso: catálogo, creación de pedido, checkout, generación y resultado. Cada query cuesta ~190-200 ms de ida y vuelta, y un render hace varias → transiciones lentas.

Objetivo: que el flujo del usuario no dependa de la BD. Catálogo estático + pedido y resultado en memoria del servidor con TTL.

## Capas nuevas

1. **`lib/data/products.ts`** — catálogo estático tipado. Fuente de verdad de productos (reusa `prisma/seed-data.ts`). Tipo `CatalogProduct` con `id = slug`.

2. **`lib/store/orders.ts`** — store en memoria (Map global con TTL 24 h). Guarda pedidos con `productId`, `paymentStatus`, `confirmedAt`, `formData`, y el resultado (`aiResponseStatus`, `textContent`, `imageBytes`, `error`, `retryCount`, timestamps). API:
   - `createPendingOrder({ productId, formData })`
   - `getCheckoutOrder(id)` / `getOrderById(id)` / `getOrderGeneration(id)` / `getOrderForGeneration(id)`
   - `confirmOrder(id)`
   - `setProcessing`, `saveText`, `saveImage`, `markCompleted`, `markError`, `retryGeneration`
   - `getResultText`, `getResultFile`
   - `logStep`

## Pasos

1. **Catálogo estático** (`lib/data/products.ts` + reescribir `lib/services/products.ts`):
   - Definir `CatalogProduct` (mismos campos que `ProductSeed`, con `id: string`).
   - Mover/duplicar los 6 productos desde `prisma/seed-data.ts`.
   - `getProducts`, `getProductBySlug`, `getProductById` leen de las constantes (sin Prisma). Los tipos de retorno deben ser compatibles con lo que consumen las páginas (formSchema, aiTextTemplate, aiPromptTemplate, imageUrl, name, tagline, description).

2. **Store en memoria** (`lib/store/orders.ts`):
   - Map global tipado `Record<orderId, StoredOrder>` con TTL y limpieza perezosa (borrar al leer si expiró; o un `setInterval` no bloqueante).
   - `StoredOrder`: `{ productId, paymentStatus, confirmedAt, createdAt, formData, result }` donde `result` es `StoredResult` (estado + texto + imagen + error + retryCount + timestamps).
   - Resolver el `product` desde el catálogo estático para armar los objetos que devuelven `getCheckoutOrder`/`getOrderGeneration`/etc. (deben seguir teniendo `.product`, `.formSubmission`, `.generatedResult` para no tocar las páginas).

3. **Reescribir `lib/services/orders.ts`** para usar el store:
   - `createPendingOrder`, `getCheckoutOrder`, `getOrderById`, `getOrderGeneration`, `confirmOrder`.

4. **Reescribir `lib/services/generation.ts`** para usar el store:
   - `getOrderForGeneration`, `setProcessing`, `saveText`, `saveImage`, `markCompleted`, `markError`, `retryGeneration`, `getResultText`, `getResultFile`, `logStep`.

5. **`trigger/events.ts`**: `enqueueGeneration` → fire-and-forget `runGenerationInline(orderId)` (sin Trigger.dev). Mantener firma.

6. **Tests**:
   - Reescribir `tests/unit/orders-service.test.ts` y `tests/unit/generation-service.test.ts` para el store en memoria (sin mockear `@/lib/db/prisma`).
   - Revisar `scripts/smoke-pipeline.test.ts` y `scripts/smoke-admin.test.ts`: el smoke del pipeline debe usar el store (o quedar documentado); el smoke de admin sigue con Prisma.

7. **Verificación**: `npm test`, `npm run lint`, `npm run build`, y prueba manual del flujo en `next dev` sin `DATABASE_URL` disponible (o con logs de Prisma off).

## Riesgos / decisiones

- **Tipos de retorno**: los objetos devueltos por los servicios deben ser estructuralmente compatibles con lo que usan las páginas (delegación: `order.product`, `order.formSubmission.formData`, `order.generatedResult.*`). Si una página usa campos que el store no guarda, hay que mapearlos.
- **`imageBytes`**: el store guarda `Uint8Array` (mismo tipo que usa la BD). `/api/resultado` no cambia.
- **TTL**: 24 h para pedidos completados; pedidos PENDING pueden expirar antes (1 h) para no acumular.
