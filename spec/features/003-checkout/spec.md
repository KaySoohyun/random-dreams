# 003 · Checkout sin pasarela

**Estado:** propuesta

## Qué hace

- `/checkout/[orderId]` (reemplaza el stub de 002) muestra la **confirmación unitaria** de la creación: producto, las respuestas del formulario con sus labels (multiselect como lista legible) y la entrega esperada (`.txt` + `.png`, generado en ~1 min, sin cargo).
- El botón **"Confirmar y generar"** ejecuta la Server Action `confirmOrder(orderId)`:
  - Valida que el pedido exista y esté `PENDING`; un `orderId` inexistente → 404.
  - Transición **`PENDING → APPROVED`** (solo hacia adelante, validado en el servidor) y setea `confirmedAt`.
  - Crea **`GeneratedResult`** con `aiResponseStatus = QUEUED` (si no existe; idempotente) — el estado que la página de generación va a pollear.
  - Redirige a `/generacion/[orderId]`.
- Stub de `/generacion/[orderId]`: lee `GeneratedResult` y muestra un estado mínimo ("en cola / generando…") + nota de que el pipeline real llega en 004.
- **Idempotencia**: confirmar dos veces (recarga, doble submit) no duplica ni rompe; un pedido ya `APPROVED` redirige directo a `/generacion/[orderId]`.

## Por qué

Cierra el flujo de confirmación simulada exigido por el MVP (sin pasarela) y establece el **contrato de estados** (`Order` + `GeneratedResult`) que la feature 004 (pipeline Inngest) consume. La creación del `GeneratedResult` al confirmar se alinea con la regla de consistencia del módulo 0.4.

## Criterios de aceptación

- [ ] `/checkout/[orderId]` muestra el resumen: nombre del producto y respuestas del formulario con sus labels (el multiselect se muestra como lista legible, no como string crudo).
- [ ] Confirmar un pedido `PENDING` → `APPROVED`, setea `confirmedAt` y crea `GeneratedResult` (`QUEUED`), y redirige a `/generacion/[orderId]`.
- [ ] Confirmar dos veces (doble submit / recarga) es idempotente: no crea un segundo `GeneratedResult` ni rompe; redirige a `/generacion/[orderId]`.
- [ ] Un pedido `REJECTED` (reservado) no puede confirmarse.
- [ ] La página de checkout de un pedido ya confirmado redirige a `/generacion/[orderId]`.
- [ ] Un `orderId` inexistente → 404.
- [ ] El botón "Confirmar y generar" se deshabilita mientras se procesa.
- [ ] Diseño según wireframe 0.3 (4.3): card de resumen, "Entrega: texto .txt + imagen .png (generado en ~1 min)", "Sin cargo", responsive.
- [ ] `npm run lint`, `npm test` y `npm run build` pasan.

## Fuera de alcance

- **Pipeline de generación IA** (Inngest) — feature **004** (el trigger `order/confirmed` de Inngest se dispara ahí, no en 003).
- Página de generación con **polling** y botón de reintento — features **004 / 005** (003 solo deja un stub que lee el estado).
- Storage en la nube / entrega de archivos — V1.
- `REJECTED` como estado funcional — reservado para integración futura.
