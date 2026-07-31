# 002 · Formulario dinámico — Plan

_Cómo se implementa lo descrito en `spec.md`. Respeta `constitution/` (tech-stack: Next.js 15 + React 19, Zod, Prisma/Supabase, Tailwind 4) y el módulo 0.4 (Order, FormSubmission)._

## Enfoque

- **Motor genérico y data-driven**: un builder convierte `Product.formSchema` en un **schema Zod** (módulo compartido cliente/servidor); un componente cliente `DynamicForm` renderiza los campos y valida. Nuevos productos no requieren código nuevo.
- **Server Action con `useActionState`** (React 19): estado pendiente, errores por campo y `redirect()` al checkout tras crear el pedido.
- **Capas**: la acción delega en `lib/services/orders.ts` (transacción `Order` + `FormSubmission`); el dominio no importa de `next/*`.

## Implementación

1. **Migración `add_orders`** — agregar `enum PaymentStatus` + modelos `Order` y `FormSubmission` a `prisma/schema.prisma` (módulo 0.4) y migrar.
2. **Builder Zod** — `features/forms/build-form-schema.ts`: construye `z.object` desde `formSchema.fields`:
   - `text`: `z.string().trim().min(1).max(n)` si requerido; opcional admite `""` → `undefined`.
   - `number`: `z.coerce.number().min().max()` (FormData envía string).
   - `select`: `z.enum(options)`; opcional admite valor vacío.
   - `multiselect`: `z.array(z.enum(options)).min().max()`; se transporta como string unido por `,`.
3. **Componentes** — `features/forms/dynamic-form.tsx` (cliente, `useActionState`) + `features/forms/fields.tsx` (`TextField`, `SelectField`, `MultiSelectField` con chips y `aria-pressed`); controles visibles actualizan `hidden inputs` con `name` del campo.
4. **Servicio** — `lib/services/orders.ts`: `createPendingOrder({ productId, formData })` con transacción interactiva (`tx.order.create` PENDING + `tx.formSubmission.create`).
5. **Acción** — `features/forms/actions.ts`: `createOrder(prevState, formData)` validando con el builder + re-obteniendo el producto; éxito → `redirect("/checkout/" + order.id)`; error → `{ errors }` por campo.
6. **Integración** — `app/(store)/producto/[slug]/page.tsx`: el CTA "Continuar" pasa a ser el submit del `DynamicForm` (se le pasa `formSchema`, `productId` y la acción con `.bind`).
7. **Stub checkout** — `app/(store)/checkout/[orderId]/page.tsx` mínimo: lee el pedido y muestra resumen básico + nota de que la confirmación llega en 003.
8. **Tests** — `build-form-schema.test.ts` (payloads válidos/inválidos, min/max, opcionales), `orders-service.test.ts` (mock de prisma, transacción), `dynamic-form.test.tsx` (render, errores por campo, submit con `@testing-library/user-event`).
9. **Validación** — lint + test + build; criterios del spec; mover 002 a "Hecho" en el roadmap; actualizar documentación.

## Decisiones

- **Formulario en la misma página que la ficha** (wireframe 0.3), no ruta separada; el CTA deshabilitado de 001 pasa a ser el submit.
- **Zod compartido cliente/servidor** — una sola definición de reglas; el servidor siempre re-valida (nunca confiar en el cliente).
- **`useActionState` + `.bind(productId)`** — el `productId` viaja en la referencia de la acción, no en campos ocultos manipulables.
- **Opcionales → ausentes** — el parseado normaliza (`""` → `undefined`), cumpliendo el criterio de no guardar cadenas vacías.
- **`multiselect` como `,` en hidden input** — formato simple de transporte; se valida con `z.array(...).min().max()`.
- **Stub de checkout en 002** — necesario como destino del redirect; la confirmación real es 003.

## Riesgos

- **`formSchema` inválido en runtime** — el builder lanza un error claro; el test de estructura del seed (001) ya garantiza tipos soportados y opciones.
- **Server Action pasada a un Client Component** — soportado en Next 15 como referencia; se verifica en el build.
- **Números desde FormData (string)** — `z.coerce.number()` con mensajes de error específicos.
- **Transacciones interactivas con el adapter pg** — soportadas; se cubre con el test del servicio.
