# 002 · Formulario dinámico

**Estado:** propuesta

## Qué hace

- El botón "Continuar" de la ficha de producto (`/producto/[slug]`) queda **habilitado** y despliega el formulario dinámico generado a partir de `Product.formSchema` (tipos: `text`, `number`, `select` y `multiselect`).
- El formulario se valida con **Zod en el cliente** (mensajes de error por campo, sin recargar) y **en el servidor** (Server Action; re-valida antes de persistir).
- Al enviar con datos válidos, se crea `Order` (estado `PENDING`) + `FormSubmission` con la respuesta validada, **en la misma transacción**, y el usuario pasa a `/checkout/[orderId]` (la confirmación completa llega en la feature 003).
- **Sin persistencia temporal**: si el usuario abandona antes de confirmar, pierde la respuesta (no hay draft en DB ni en localStorage).

## Por qué

Es el corazón del modelo data-driven: el mismo motor sirve para los 6 productos (y los futuros) sin cambios de código. Además, el formulario alimenta todo el flujo siguiente (checkout → generación → resultado).

## Criterios de aceptación

- [ ] `/producto/[slug]` muestra un formulario generado desde `formSchema` con los 4 tipos de campo (text, number, select, multiselect).
- [ ] Enviar con campos obligatorios vacíos no crea la orden y muestra un error claro por campo (validación cliente).
- [ ] El servidor re-valida con Zod: un payload inválido (ej. valor fuera de `options`) no crea la orden y devuelve errores.
- [ ] Un envío válido crea `Order` (`PENDING`) + `FormSubmission` con el payload parseado (números como número, multiselect como array) en una misma transacción, y redirige a `/checkout/[orderId]`.
- [ ] El `multiselect` respeta `min`/`max` (ej. Quimera: 2 a 3 animales).
- [ ] Campos opcionales vacíos se guardan como ausentes (no como cadena vacía).
- [ ] No hay draft persistido antes de confirmar (sin tablas de borradores ni localStorage).
- [ ] Diseño según módulo 0.3: labels asociados, errores con `role="alert"`, foco visible y navegación por teclado; responsive.
- [ ] `npm run lint`, `npm test` y `npm run build` pasan.

## Fuera de alcance

- **Confirmación / checkout completo** — feature **003** (en 002 solo hay un stub de `/checkout/[orderId]` para recibir el redirect).
- Persistencia temporal de formularios (drafts) — descartada en 0.1.
- Estados transaccionales avanzados del pedido (aprobación) — feature **003**.
