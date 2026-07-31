# Incidente: el pipeline de generación no corre en Inngest Cloud

**Fecha:** 2026-07-31 · **Severidad:** alta (bloquea el flujo real completo en producción) · **Estado:** pendiente de conexión en el dashboard de Inngest.

## Síntoma

- Un pedido se crea y confirma con normalidad: `Order.paymentStatus` pasa a `APPROVED` y el usuario aterriza en `/generacion/[orderId]`.
- La página de generación queda **"En cola" (QUEUED)** para siempre. El estado no progresa a `PROCESSING` ni `COMPLETED`.
- En `/admin`, la orden aparece `APPROVED` + `QUEUED` y el detalle muestra la tabla de `GenerationLog` **vacía (0 entradas)**.

## Evidencia

| Chequeo | Resultado |
| --- | --- |
| POST a `https://inn.gs/e/<INNGEST_EVENT_KEY>` con el evento `order/confirmed` | `HTTP 200`, devuelve `{"ids":[…],"status":200}` → **el evento llega a Inngest Cloud** |
| Función `generationPipeline` en Inngest Cloud | **No se ejecuta** (0 ejecuciones, 0 `GenerationLog`) |
| `GET /api/inngest` en Vercel sin firma | `HTTP 401` → el endpoint está desplegado y el handshake de firma responde |
| Signing key en Vercel (`INNGEST_SIGNING_KEY`) | Formato válido: `signkey-prod-…` |
| Órdenes afectadas | `cms9d7hxf000004kzb06becr4` (prueba manual de las 22:58) + las 2 del QA |

## Diagnóstico

Inngest Cloud **recibe** el evento pero **no tiene registrada la app** que debe ejecutarlo. En Cloud, cada app se conecta a Inngest Cloud de forma **pull-based**: la app arranca, registra sus funciones haciendo *handshake* contra el endpoint `https://api.inngest.com/cloud/…` y queda registrada en el dashboard. Si la app `random-dreams` **no está creada/registrada** en `app.inngest.com` (o usa una **signing key distinta** a la del dashboard), los eventos se aceptan pero nadie los procesa.

No alcanza con que el endpoint `/api/inngest` responda: la app debe estar **sincronizada** desde el dashboard con `https://app-random-dreams.vercel.app/api/inngest` y la **misma signing key** que está en Vercel.

## Cómo arreglarlo (en `app.inngest.com`)

1. Abrir https://app.inngest.com y entrar con la cuenta dueña de las claves.
2. **Crear la app** `random-dreams` (Apps → Create / Add app), o abrir la app existente si ya aparece.
3. Configurar el **endpoint de producción**: `https://app-random-dreams.vercel.app/api/inngest`.
4. Setear la **signing key** de la app en el dashboard con el **mismo valor** que está en Vercel (env var `INNGEST_SIGNING_KEY`, valor `signkey-prod-…` — consultar `.env.production.local`).
5. **Sincronizar / Sync** la app desde el dashboard y verificar que la función `order/confirmed` (pipeline `composePrompt → generateImage → uploadResult → markCompleted`) quede registrada como *active*.
6. Revisar en el dashboard que **no haya errores de handshake o de firma** (sección de la app / pestaña *functions*).

## Verificación

1. En `/admin`, abrir la orden `cms9d7hxf000004kzb06becr4` (u otra en `QUEUED`) y pulsar **Reintentar generación**, o hacer un pedido nuevo de prueba.
2. Esperar a que el estado pase a `PROCESSING` y luego a `COMPLETED` (los pasos generan entradas en `GenerationLog`: `GENERATE_TEXT`, `GENERATE_IMAGE`, `UPLOAD_RESULT`, `MARK_COMPLETED`).
3. Confirmar en `/generacion/[orderId]` que aparece el resultado descargable (texto + imagen).
4. Chequear en el dashboard de Inngest que la ejecución aparezca con los 4 pasos en verde y `duration` razonable.
5. Re-ejecutar el QA del flujo real (Playwright contra producción).

## Notas

- El envío de eventos usa la base `https://inn.gs/e/<eventKey>` (constante `defaultInngestEventBaseUrl`), **no** `api.inngest.com` (que da 405).
- El fallo es de **registro/sincronización de la app en Cloud**, no de código: el flujo completo (formulario → checkout → orden `APPROVED` → `/generacion` con polling) funciona y el endpoint `/api/inngest` responde correctamente.
- Mientras tanto, ninguna orden pasa de `QUEUED`; las descargas (texto + imagen) quedan sin poder verificar en producción.
