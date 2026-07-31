# 002 · Formulario dinámico — Tareas

_Checklist derivada de `plan.md`._

- [x] Migración `add_orders` (enum `PaymentStatus` + `Order` + `FormSubmission`).
- [x] `features/forms/build-form-schema.ts` (builder Zod data-driven).
- [x] `features/forms/fields.tsx` (TextField, SelectField, MultiSelectField).
- [x] `features/forms/dynamic-form.tsx` (cliente, `useActionState`).
- [x] `lib/services/orders.ts` (`createPendingOrder` con transacción).
- [x] `features/forms/actions.ts` (`createOrder` + `redirect`).
- [x] Integrar el formulario en `app/(store)/producto/[slug]/page.tsx` (CTA habilitado).
- [x] Stub `app/(store)/checkout/[orderId]/page.tsx`.
- [x] Tests: builder Zod, servicio de órdenes (mock prisma), DynamicForm (user-event).
- [x] Correr `npm run lint`, `npm test` y `npm run build`.
- [x] Validar contra los criterios de aceptación de `spec.md`.
- [x] Mover 002 a "Hecho" en `../../constitution/roadmap.md` y actualizar documentación.

## Mantenimiento (checklist recurrente)

- [x] Al agregar un tipo de campo nuevo a un producto: actualizar el builder, el componente de campo y el test de estructura del seed.
