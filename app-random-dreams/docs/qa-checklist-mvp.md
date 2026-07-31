# Checklist QA — MVP Random Dreams

Verificación manual pre-lanzamiento. Marcar cada ítem tras comprobarlo en un entorno reciente (**staging** primero, **producción** al final).

## Flujo del usuario

- [ ] Home muestra los **6 productos** (catálogo data-driven).
- [ ] `/producto/[slug]` muestra detalle y formulario dinámico correctos por producto.
- [ ] Validación del formulario: campos requeridos, tipos (texto/número), `multiselect` con mín/máx; errores visibles en cliente y servidor.
- [ ] Submit crea la orden y redirige a `/checkout/[orderId]`.
- [ ] Checkout muestra el resumen con labels y el botón "Confirmar y generar".
- [ ] Confirmar → `paymentStatus: APPROVED` → redirige a `/generacion/[orderId]`.
- [ ] `/generacion/[orderId]` pasa por `En cola` → `Generando…` → `Completado` (polling sin recarga manual).
- [ ] Resultado: texto visible y preview de imagen (`next/image`).
- [ ] Descarga del `.txt` (`resultado.txt`) y de la imagen (`.png` en mock / `.jpg` real) con contenido válido.
- [ ] Estado `ERROR` muestra mensaje + botón "Reintentar"; el reintento resetea a `QUEUED` y `retryCount` aumenta.
- [ ] 404s: `/producto/xx` y `/generacion/xx` inexistentes.

## Panel admin

- [ ] `/admin` sin sesión → redirige a `/admin/login`.
- [ ] Token incorrecto → error visible; token correcto → dashboard.
- [ ] Dashboard muestra conteos de órdenes y generaciones + últimas órdenes.
- [ ] `/admin/ordenes`: filtro por estado, búsqueda por id y paginación.
- [ ] Detalle: resumen del producto, respuestas con labels, `GeneratedResult` (estado/retry/errores/fechas) y `GenerationLog` (step/status/duration/payload/error).
- [ ] "Reintentar generación" solo en `ERROR` y funciona (vuelve a `QUEUED`).
- [ ] Logout borra la cookie y vuelve a `/admin/login`.

## Seguridad básica

- [ ] `/admin` no aparece en `robots.txt`/metadatos (no indexable).
- [ ] Cookie de sesión `httpOnly`, `sameSite: strict`, `secure` en HTTPS, expiración 12 h.
- [ ] No hay claves (Gemini/HF/Supabase) expuestas en el cliente ni en el repo.
- [ ] Las Server Actions del panel re-verifican la sesión (no solo el layout).

## Calidad y rendimiento

- [ ] Lighthouse ≥ 90 en `/`, ficha de producto y `/generacion/[orderId]` (movil y desktop).
- [ ] Página de generación no hace polling infinito en estados terminales (se desmonta el `AutoRefresh`).
- [ ] El texto de la página está en español, sin textos rotos ni emojis no deseados.
- [ ] Responsive básico: home, formulario, checkout, generación y admin en móvil (375 px).

## Backoffice / operación

- [ ] Colas Inngest en verde (sin reintentos fallidos acumulados) en el dashboard de Inngest Cloud.
- [ ] `GenerationLog` con 8 entradas por generación completada.
- [ ] Smoke con proveedores **reales** (`AI_MOCK=false`) ejecutado manualmente antes del release.
- [ ] CI en verde en `main` (lint, unit, build, smoke, e2e).
