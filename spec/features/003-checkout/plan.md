# 003 · Checkout sin pasarela — Plan

_Cómo se implementa lo descrito en `spec.md`. Respeta `constitution/` (tech-stack: Next.js 15 + React 19, Prisma/Supabase, Tailwind 4) y el módulo 0.4 (Order, GeneratedResult)._

## Enfoque

- **Confirmación unitaria sin pasarela**: el checkout es una página de resumen con un único botón que aprueba el pedido. `Order.paymentStatus` transiciona `PENDING → APPROVED` solo en el servidor.
- **El `GeneratedResult` (QUEUED) nace al confirmar** — es el estado que la feature 004 va a transicionar y que 004/005 van a pollear. 003 no dispara Inngest (no hay funciones aún).
- **Capas**: la Server Action delega en `lib/services/orders.ts`; render del resumen data-driven usando `Product.formSchema` (labels) sobre `FormSubmission.formData`.

## Implementación

1. **Migración `add_generated_result`** — agregar `enum AiResponseStatus` + modelo `GeneratedResult` (con `@@index` de `aiResponseStatus` y `productId`, relación 1:1 con `Order`) a `prisma/schema.prisma` según módulo 0.4 y migrar; regenerar cliente.
2. **Servicio** — `lib/services/orders.ts`:
   - `confirmOrder(orderId)`: transacción — si `paymentStatus !== PENDING` aborta (idempotente/`REJECTED`); si ya `APPROVED` devuelve la order sin tocar; setea `APPROVED` + `confirmedAt`; `tx.generatedResult.upsert` (clave `orderId`) con `QUEUED` y `aiRequestPayload` = snapshot del `formData`.
   - `getCheckoutOrder(orderId)`: `Order` + `product` + `formSubmission`.
3. **Acción** — `features/checkout/actions.ts`: `confirmOrder(orderId)` que re-lee la order, verifica `PENDING`/`APPROVED` y `redirect("/generacion/" + orderId)`.
4. **Página checkout** — `app/(store)/checkout/[orderId]/page.tsx`: resumen (producto + respuestas con labels del `formSchema`, multiselect como lista) + botón "Confirmar y generar" (formulario con la acción; deshabilitado mientras procesa). Pedido ya `APPROVED` → `redirect` a `/generacion/[orderId]`; inexistente → `notFound()`.
5. **Stub generación** — `app/(store)/generacion/[orderId]/page.tsx`: lee `GeneratedResult` (404 si no existe) y muestra estado mínimo (`QUEUED` = "en cola…") + nota de que el pipeline llega en 004.
6. **Tests** — `orders-service.test.ts`: casos nuevos (`confirmOrder` transición, idempotencia, `REJECTED`, upsert de `GeneratedResult`); `checkout-page` se cubre con smoke test manual (las Server Actions de `redirect`/`notFound` no se testean unitariamente).
7. **Validación** — lint + test + build; criterios del spec; smoke test real del flujo completo (formulario → checkout → confirmar → generación); mover 003 a "Hecho" en el roadmap; actualizar documentación.

## Decisiones

- **`GeneratedResult` se crea en 003, Inngest en 004** — el trigger `order/confirmed` y las funciones del pipeline son 004; crear el registro al confirmar fija el estado inicial `QUEUED` sin acoplar al proveedor de IA.
- **Upsert por `orderId`** — `orderId` es `@unique` (1:1); la idempotencia se garantiza por clave, no por checks de carrera.
- **Snapshot `aiRequestPayload` = `formData`** al crear; 004 completa la interpolación de plantillas (decisión interina documentada en 0.4).
- **Resumen data-driven** — se renderiza con `product.formSchema` (labels/tipos), nunca con nombres de campo crudos.
- **`REJECTED` sin flujo** — reservado en el enum; `confirmOrder` lo rechaza.

## Riesgos

- **Doble submit / recarga en confirmación** — cubierto por transacción + upsert idempotente; el botón se deshabilita mientras procesa.
- **`formData` como `Json` en Prisma 7** — tipar con `Prisma.InputJsonValue` (ya resuelto en 002).
- **Stub de generación accedido sin `GeneratedResult`** — 404 con mensaje claro; el flujo normal siempre crea el registro antes de redirigir.
