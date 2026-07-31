# 005 · Entrega de resultado

**Estado:** implementado ✅

## Qué hace

- **`/generacion/[orderId]`** (reemplaza el stub) muestra el ciclo completo de entrega según `GeneratedResult.aiResponseStatus`:
  - `QUEUED` / `PROCESSING`: estado ("En cola… / Generando…") con **polling** cada 3 s. Componente cliente `AutoRefresh` que llama `router.refresh()` en un intervalo; el servidor re-renderiza la página y, cuando el estado pasa a `COMPLETED`/`ERROR`, el componente se desmonta (no más polling).
  - `COMPLETED`: vista del resultado — el **texto** y el **preview de la imagen** (contenido generado, en el idioma del pedido) + **descarga directa** del `.txt` y de la imagen. El nombre/extensión es el real (`resultado.png` con mock, `resultado.jpg` con fal-ai), derivado por `lib/ai/image-format.ts`.
  - `ERROR`: mensaje de error + botón **"Reintentar"** (solo en este estado).
- **Servir los archivos**: Route Handler **`/api/resultado/[orderId]`** (consistente con `app/api` para "storage"):
  - `?formato=texto` → `text/plain; charset=utf-8`.
  - `?formato=imagen` → content-type por extensión (`image/png` / `image/jpeg`).
  - `&descarga=1` → `Content-Disposition: attachment; filename="<archivo>"` (nombre desde `textFileName`/`imageFileName`).
  - 404 si no existe el pedido/resultado o faltan bytes. El `<img>` usa la misma URL (inline); la descarga es un `<a download>` nativo del navegador, sin Server Actions ni base64 inflados.
- **Reintento** (`retryGeneration` en `lib/services/generation.ts`): solo desde `ERROR`. Resetea a `QUEUED` (limpia `error`, `startedAt`, `completedAt`, `textContent`/`textFileName`/`imageBytes`/`imageFileName`), incrementa **`retryCount`** (campo ya existe en el schema → sin migración) y re-dispara `order/confirmed`. La pipeline regenera completa; el guard de `COMPLETED` la mantiene idempotente.

## Por qué

Cierra el flujo MVP de entrega: el usuario ve y descarga su creación, tiene feedback de la generación asíncrona (polling, no webhooks) y una salida ante error (el reintento manual que 004 dejó prometido). Sin esto el resultado queda atrapado en Postgres sin forma de consumirlo.

## Criterios de aceptación

- [ ] En `QUEUED`/`PROCESSING` la página muestra el estado y se auto-refresca (polling) sin recarga manual.
- [ ] Al completarse muestra el texto y el preview de la imagen, y deja de pollear.
- [ ] Descarga directa del `.txt` y de la imagen con nombre/extensión correctos y `Content-Disposition` con el filename real.
- [ ] Content-types correctos: `text/plain`, `image/png`, `image/jpeg`.
- [ ] `ERROR` muestra el mensaje y el botón "Reintentar" únicamente en ese estado.
- [ ] `retryGeneration` solo actúa desde `ERROR`: resetea a `QUEUED`, limpia contenido/error/timestamps, `retryCount + 1` y re-dispara `order/confirmed`.
- [ ] Idempotencia: un pedido `COMPLETED` o `PROCESSING` no puede volver a `QUEUED`; reintentar no duplica resultados.
- [ ] Pedido inexistente, sin `GeneratedResult` o sin archivos → 404 (página y route handler).
- [ ] `npm run lint`, `npm test` y `npm run build` pasan.

## Fuera de alcance

- **Auth / control de acceso real** y URLs firmadas con expiración — V1 (008 autenticación, 009 storage). En MVP el acceso es por `orderId` (cuid no adivinable); se documenta el riesgo.
- **Historial y redescarga** de resultados previos — feature **010**.
- **Storage en la nube** (Supabase) — feature **009** (`uploadResult` sigue persistiendo en Postgres).
- **Notificación al terminar** (push/webhook) — el MVP usa polling (convención).
- **E2E Playwright** del flujo completo — feature **007**.
