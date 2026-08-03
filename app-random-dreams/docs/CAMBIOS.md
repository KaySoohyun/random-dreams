# Cambios

Registro de cambios relevantes. Último primero.

## 2026-08-03 — Descarga de resultados 100% client-side (sin API JSON)

**Motivo:** la descarga de resultados abría `/api/resultado/[orderId]`, que devolvía `{ error: "Resultado no encontrado" }` (JSON 404) cuando el request caía en una instancia serverless fría sin el resultado en memoria. El navegador lo descargaba como archivo `.json`. La generación no usa BD (feature 017), así que el resultado vive solo en la instancia que lo generó.

**Qué cambió:**

- `lib/pdf/result-document.tsx` (nuevo): componente de documento PDF (`ResultDocument`) **compartido server/client**, sin `server-only` ni acceso al filesystem. Reusa `parseMarkdown` de `lib/pdf/markdown.ts` (heading 1-3, párrafo, listas, blockquote, código, hr, inline bold/italic/code).
- `lib/pdf/client-pdf.tsx` (nuevo): `renderResultPdfClient(markdown) → Promise<Blob>` con `pdf(<ResultDocument …/>).toBlob()` (genera el PDF en el navegador).
- `lib/pdf/markdown-pdf.tsx`: refactorizado a wrapper server-only (`readLogoDataUri` de `public/assets/logo_pdf.png`; `renderResultPdf` reusa `ResultDocument` con logo).
- `lib/ai/image-format.ts`: `imageBytesToDataUrl(bytes)` convierte los bytes de la imagen en `data:<mime>;base64,…` para la página y las descargas.
- `lib/services/generation.ts`: helpers puros de nombres de archivo `firstNameValue(formSchema, formData)` y `buildResultBaseName({slug, nameValue, date?})` (formato fecha `YYYY-MM-DD`, slugify NFD); `buildResultFileName` y `getResultFileName` los reusan.
- `lib/store/orders.ts`: `GenerationOrderView` ahora incluye `formSchema` y `formData` (para que la página derive el nombre del archivo sin llamar al API).
- `features/result/download-menu.tsx`: recibe `textContent`, `imageDataUrl` y `fileNameBase` por props; los botones PDF/Texto/Imagen disparan descargas client-side (PDF vía dynamic import de `renderResultPdfClient`, Texto/Imagen con `Blob` + `<a download>`).
- `app/(store)/generacion/[orderId]/page.tsx`: renderiza la imagen desde `imageBytesToDataUrl` (ya no depende del endpoint) y pasa el contenido y el nombre base al menú de descargas.
- Tests: `tests/unit/download-menu.test.tsx` migrado al nuevo API de props; `tests/unit/client-pdf.test.ts` (nuevo) verifica que `renderResultPdfClient` genera un Blob `%PDF`.

150 tests pasando, lint OK, build OK.

**Pendiente:** el endpoint `/api/resultado/[orderId]` se mantiene para `Content-Disposition` legacy y la vista previa, pero el flujo principal de descarga ya no depende de él.

## 2026-08-03 — Pedidos recuperables entre instancias serverless (cookie firmada)

**Motivo:** en producción, un pedido recién creado a veces mostraba "Este pedido ya fue triturado" al navegar a su URL. La causa: el store en memoria de la feature 017 (`globalForStore`) solo se comparte entre requests en desarrollo; en producción **cada instancia serverless tiene su propio `Map`**, así que el pedido se perdía al cambiar de instancia o tras un cold start.

**Qué cambió:**

- `lib/store/order-cookie.ts` (nuevo): capa de recuperación del pedido en una **cookie firmada** (HMAC-SHA256 con `node:crypto`, `timingSafeEqual`). Cookie `rd_order_<id>`, httpOnly, sameSite lax, secure en prod, path `/`, maxAge 24 h. El payload es el `StoredOrder` serializado **sin `result.imageBytes`** (y sin `textContent` si supera ~3.5 KB, el límite práctico de cookies). El secreto se lee de `ORDER_COOKIE_SECRET` (con fallback solo para dev). Sin request scope (pipeline, tests) la escritura/lectura es no-op.
- `lib/store/orders.ts`: se exportan `hydrateStoredOrder` y `getStoredOrderInStore`.
- `lib/services/orders.ts`: `createPendingOrder` ahora es `async` y escribe la cookie al crear; `getOrderById`/`getCheckoutOrder`/`getOrderGeneration`/`getOrderForGeneration` primero intentan el store y, si no está, **hidratan desde la cookie**; `confirmOrder` re-escribe la cookie con el estado confirmado. Nuevo `syncOrderCookie(orderId)` (set o clear según el store).
- `tests/unit/orders-service.test.ts`: actualizado a las funciones `async`.
- `.env.example` (local, ignorado por git): se documenta `ORDER_COOKIE_SECRET`.

**Pendiente (producción):**

1. Definir `ORDER_COOKIE_SECRET` en Vercel (Settings → Environment Variables) con un valor largo y aleatorio; sin él, prod usa un fallback hardcodeado (no es una firma real).
2. El resultado generado (texto/imagen) sigue sin persistir entre instancias: la cookie solo transporta el pedido y su estado al momento de confirmar. Si el serverless cambia durante la generación, la página puede quedar en "Generando…" hasta reintentar desde una instancia con el pedido en memoria.

## 2026-08-03 — Optimización de latencia del flujo form → checkout (sin BD en el render)

**Motivo:** la transición de la página de producto (formulario) al checkout tardaba ~1.35 s. No hay API externa en ese tramo: la demora era la **base de datos remota** (Supabase, región ca-central-1, ~190-200 ms de ida y vuelta por query) sumada a la cantidad de round trips en secuencia.

**Qué cambió:**

- `lib/services/orders.ts`:
  - `createPendingOrder` pasó de una **transacción interactiva** (BEGIN + insert Order + insert FormSubmission + COMMIT ≈ 4 round trips, ~766 ms) a un **CTE en una sola query** (~202 ms) que inserta Order y FormSubmission juntos. Los ids se generan en JS con `randomUUID()`.
  - `getCheckoutOrder` pasó de `findUnique` con 2 includes (≈ 2 round trips, ~384-1200 ms) a un **join directo en 1 query** (~203 ms). Se tipó el resultado con `CheckoutOrder` (solo los campos que usa la página).
- `lib/services/products.ts`: caché en memoria **TTL 30 s** para `getProducts`/`getProductBySlug`/`getProductById` (el catálogo cambia poco; se evita re-leerlo en cada request, incluida la Server Action `createOrder`). `unstable_cache` no funciona dentro de Server Actions, por eso es un memo simple. Se agregó `clearProductCache()`.
- `tests/unit/orders-service.test.ts`: tests actualizados a la nueva implementación (CTE en 1 query y join del checkout).

**Medición (mediana, Supabase ca-central-1):**

| Paso | Antes | Después |
|---|---|---|
| `getProductById` (en `createOrder`) | ~200 ms | ~0-203 ms (caché TTL) |
| `createPendingOrder` | ~766 ms (4 RT) | ~202 ms (1 RT) |
| `getCheckoutOrder` (página checkout) | ~384-1200 ms (2 RT) | ~203 ms (1 RT) |
| **Total transición form → checkout** | **~1.35 s** | **~405-608 ms** |

131 tests pasando, lint OK.

**Pendiente:** la home y la página de producto todavía leen de la DB en cada navegación (siguiente paso: quitar la persistencia del flujo y guardar el pedido en memoria/URL).

## 2026-08-02 — Rediseño "Recuerdos de lo Inexistente" (tema oscuro + dorado)

**Qué cambió:**

- `docs/componentes.md` se actualizó a un diseño **oscuro con acento dorado** (tipografía serif, fondos `#0b0f14`, dorado `#d4af37`). La web adopta ese diseño.
- **`app/globals.css`:** se reemplaza la paleta "candy" por la paleta **"gold-night"** en `@theme` (`docs/colores.md` como fuente de verdad). Los tokens semánticos existentes (`surface`, `mist`, `line`, `ink`, `muted`, `primary`, `primary-hover`, `primary-light`, `success`, `warning`, `danger`) ahora apuntan a la nueva paleta, así que todas las páginas se retematizan sin tocar cada una. Se reestilizan `.btn-primary`, `.btn-outline`, `.field-label`, `.field-input`, se agrega `.btn-gold`, y el `body` pasa a serif con fondo oscuro + brillo dorado sutil de fondo.
- **`app/layout.tsx`:** body con `font-serif` y la tipografía de la marca.
- **Fondo:** se agrega la imagen de fondo `assets/background.png` (copiada a `public/assets/background.png`) como capa fija con `blur(2px)` + superposición oscura al 60%, tal como `docs/componentes.md` (`body::before`/`body::after` en `app/globals.css`).
- **`components/ui/navbar.tsx`:** header sticky oscuro translúcido, logo dorado ✧, título y tagline en serif mayúsculas, nav en mayúsculas con hover dorado.
- **`components/ui/footer.tsx`:** grid de 4 features al estilo `docs/componentes.md` (iconos dorados, títulos serif en mayúsculas) + barra de marca.
- **`features/catalog/hero.tsx`:** hero de página completa, titular serif con acento dorado en bloque, subtítulo y CTA `.btn-gold` que ancla a `#catalogo`.
- **`features/catalog/product-card.tsx` / `product-grid.tsx`:** cards con borde dorado sobre fondo oscuro, imagen con zoom al hover, nombre serif en mayúsculas, tagline/descripción en gris, CTA "Crear" dorado; grid con `id="catalogo"`.
- **Páginas de storefront/admin:** titulares en serif mayúsculas y tarjetas con borde dorado (producto, checkout, generación, orden-summary, admin).
- **Docs:** `docs/colores.md` reescrita con la paleta "gold-night"; `AGENTS.md` actualizado.

**Nota:** la paleta "candy" anterior se eliminó; cualquier referencia pendiente (p. ej. `btn-gradient-candy`) dejó de existir.

## 2026-08-01 — Migración Inngest → Trigger.dev

**Qué cambió:**

- Se elimina **Inngest** (`inngest/`, `app/api/inngest/route.ts`, paquetes `inngest`/`inngest-cli`) y se sustituye por **Trigger.dev v4** (`@trigger.dev/sdk@^4.5.9`).
- Nueva carpeta `trigger/`: `pipeline.ts` (lógica de generación reutilizable: `runGenerationPipeline`, `runGenerationInline`, `runImageGenerationInline`), `tasks.ts` (task `generate-text` con reintentos `maxAttempts: 5`), `events.ts` (`sendOrderConfirmed` = `tasks.trigger("generate-text", { orderId })`) y `trigger.config.ts`.
- Las Server Actions (`features/checkout/actions.ts`, `features/result/actions.ts`, `features/admin/actions.ts`) encolan con `sendOrderConfirmed` y, si Trigger.dev no está configurado (la llamada falla), **caen al fallback inline** `runGenerationInline` → el flujo no se rompe.
- `playwright.config.ts`: se quita el dev server de Inngest (el e2e usa el fallback inline). Script nuevo `npm run trigger:dev`.
- `.env.example` y `docs/despliegue-mvp.md`: `INNGEST_*` reemplazadas por `TRIGGER_API_URL` / `TRIGGER_SECRET_KEY` / `TRIGGER_PROJECT_ID` / `TRIGGER_ENVIRONMENT_ID`.
- Tests actualizados a `@/trigger/pipeline` y a la nueva lógica de encolado + fallback.

**Pendiente:** crear el proyecto en Trigger.dev Cloud, configurar las env vars en Vercel, reemplazar `proj_RANDOM_DREAMS` en `trigger.config.ts` y desplegar las tasks.

## 2026-08-01 — Imagen opcional a demanda (2 pasos)

**Qué cambió:**

- La generación queda **en 2 pasos**: primero solo texto (síncrono al confirmar, igual que antes), y en la página de resultado el usuario puede elegir **"Generar imagen"** (`ImageGenerateForm` con `useActionState`).
- Nueva acción `generateImageAction` en `features/result/actions.ts` → `runImageGenerationInline` en `inngest/run-pipeline.ts`: reinterpola `aiPromptTemplate` con el `formData` guardado, genera la imagen (Hugging Face) y la persiste con `saveImage` (nueva en `lib/services/generation.ts`). Los errores se loguean en `GenerationLog` (`GENERATE_IMAGE`) y se muestran junto al botón sin tocar el estado del texto.
- La página de resultado muestra la imagen (y su descarga) **solo si ya fue generada**; mientras tanto ofrece el botón para generarla.

**Nota:** la imagen se genera síncrona dentro del Server Action; con proveedor real puede demorar. Si en Vercel choca con el timeout del serverless, habrá que moverlo a background (Inngest).

## 2026-08-01 — Generación síncrona solo texto (temporal)

**Motivo:** desbloquear el flujo real en producción mientras se resuelve el incidente de Inngest Cloud (ver `docs/incidente-inngest-produccion.md`).

**Qué cambió:**

- **Se desactiva Inngest temporalmente:** al confirmar el pedido (o reintentar), la generación corre **síncrona** en el Server Action (`runGenerationInline` en `inngest/run-with-errors.ts`) en vez de enviar el evento `order/confirmed`. `inngest/events.ts` y `inngest/pipeline.ts` se mantienen para restaurar Inngest luego.
- **Solo texto de Gemini:** el pipeline ya no genera imagen (`GENERATE_IMAGE` eliminado de `inngest/run-pipeline.ts`). `saveTextAndImage` → `saveText` (persiste `textContent` y limpia los campos de imagen).
- **La UI de resultado ya no muestra ni permite descargar la imagen:** `app/(store)/generacion/[orderId]/page.tsx` solo muestra/descarga el texto.

**Para restaurar la generación con imagen + Inngest:**

1. Volver a agregar el paso `GENERATE_IMAGE` en `inngest/run-pipeline.ts` usando `getImageProvider()` y `saveTextAndImage`.
2. Que `features/checkout/actions.ts`, `features/result/actions.ts` y `features/admin/actions.ts` vuelvan a enviar `sendOrderConfirmed` en vez de `runGenerationInline`.
3. Reagregar la vista y descarga de imagen en la página de generación.
4. Actualizar tests (unit, smoke y e2e) que hoy asumen solo texto.

## 2026-08-01 — Migración a Trigger.dev: texto + imagen en background (verificado en prod)

**Qué cambió:**

- **Inngest eliminado** (carpeta `inngest/`, `app/api/inngest/route.ts`); el pipeline asíncrono ahora vive en `trigger/` y se orquesta con **Trigger.dev Cloud** (proyecto `proj_nklaujzeaipgfjurhwqa`, env `prod`/`dev`).
- Task `generate-dream` (`trigger/tasks.ts`, retry maxAttempts 5): `runGenerationPipeline` corre **GENERATE_TEXT (Gemini) → UPLOAD_RESULT → GENERATE_IMAGE (Hugging Face) → MARK_COMPLETED**. Si la imagen falla, no rompe el pedido (queda COMPLETED con el texto y la página ofrece reintentar la imagen).
- Las Server Actions (`checkout`, `result`, `admin`) encolan con `sendOrderConfirmed` → `tasks.trigger("generate-dream", { orderId })`, con fallback inline si Trigger.dev no está configurado.
- UI de `/generacion/[orderId]` actualizada a "tu texto e imagen".
- `trigger.config.ts`: `project: "proj_nklaujzeaipgfjurhwqa"`, `dirs: ["./trigger"]`, `maxDuration: 3600`, retries globales. CLI `trigger.dev@^4.5.9` en devDependencies; script `npm run trigger:dev`.

**Verificado en producción (2026-08-01):**

- Deploy de la task `generate-dream` (v20260801.2) y de la app en Vercel (`npx vercel --prod`).
- Pedido real creado en la BD prod y task disparada vía MCP en env `prod` → run `run_06frrg7m6kikhjre3oam7n8f01` **completed** en ~1 minuto: texto de 4740 caracteres (`resultado.txt`) e imagen de 291 KB (`resultado.jpg`) persistidos, status `COMPLETED`, `paymentStatus APPROVED`.
- Se observó el reintento automático funcionando: un `GENERATE_TEXT` falló por timeout de Gemini (504) y Trigger.dev reintentó hasta éxito.

**Pendiente:** dejar documentado cómo desplegar tasks nuevas (`npx trigger.dev deploy`) y cómo configurar las env vars en el dashboard de Trigger.dev (ya están cargadas manualmente en prod y dev).

## 2026-08-01 — Correcciones de calidad (rama mejoras-codigo)

**Qué cambió:**

- **Bug de imagen corregido (stale read):** `saveText` ya no borra la imagen; el pipeline lee el estado al inicio y `generateImageStep` solo regenera si no hay imagen. Antes, re-ejecutar el pipeline sobre un pedido con imagen la perdía.
- **`enqueueGeneration` extraído:** el bloque `try { sendOrderConfirmed } catch { runGenerationInline }` estaba duplicado en las 3 Server Actions (checkout, result, admin); ahora vive en `trigger/events.ts`.
- **`generateImageStep` reusa `runStep`:** elimina la duplicación del logging RUNNING/SUCCESS/FAILED.
- **`messageOf` movido a `lib/utils/message.ts`** (compartido entre `pipeline.ts` y `tasks.ts`).
- **Retry unificado:** `maxAttempts: 5` ahora solo en `trigger.config.ts`; se quitó el override en `tasks.ts`.
- **Cache-Control en `/api/resultado`:** `no-store` al descargar; `private, max-age=3600` en vista previa (el resultado es inmutable tras COMPLETED).
- **Lint en 0 warnings:** `argsIgnorePattern: "^_"` en `eslint.config.mjs`, parámetros renombrados a `_`-prefixed y import redundante de `FormField` eliminado en `prisma/seed-data.ts`.

## 2026-08-01 — Cobertura de tests ampliada (rama mejoras-codigo)

**Qué cambió:** se agregaron tests para funcionalidades sin cubrir (unit, vitest). De 63 a **114 tests** (20 archivos).

- `forms-actions.test.ts`: `createOrder` (producto inexistente, formSchema inválido, errores de validación, redirect al checkout).
- `checkout-actions.test.ts`: `confirmOrderAction` (notFound, encola solo al transicionar).
- `result-actions.test.ts`: `retryGenerationAction` y `generateImageAction` (éxito, error, errores no-Error).
- `resultado-route.test.ts`: GET `/api/resultado/[orderId]` (400 formato inválido, 404, content-type, Content-Disposition, Cache-Control vista/descarga).
- `huggingface.test.ts`: `HuggingFaceImageProvider.generate` (sin token, bytes binarios, respuesta JSON con/ sin imágenes, 429/5xx, 400, imagen vacía, fallo de descarga, timeout).
- `gemini.test.ts`: `GeminiContentProvider.generate` (sin api key, interpolación, texto vacío, placeholder faltante).
- `interpolate.test.ts`: `interpolateTemplate` (arrays, números, placeholder faltante).
- `forms-types.test.ts`: `isFormSchema` (tipos soportados, campos vacíos, invalidaciones).
- `admin-session.test.ts`: `getAdminSession` / `createAdminSessionValue` (token, cookie válida/vencida, nombre de cookie).
- `orders-service.test.ts`: se agregó `getOrderGeneration`.

## 2026-08-01 — Paleta "candy" en Tailwind (rama mejoras-ux-ui)

**Qué cambió:**

- Se agregó la paleta **"candy"** a `app/globals.css` dentro de `@theme` (Tailwind v4): `candy-pink`, `candy-rose`, `candy-coral`, `candy-lavender`, `candy-sky`, `candy-plum-dark`, `candy-plum-muted`, `candy-navy-dark`, `candy-charcoal`. Genera utilidades `bg-candy-*`, `text-candy-*`, `border-candy-*`.
- `docs/colores.md` queda declarado como **fuente de verdad** de la paleta; se agregó la regla en `AGENTS.md` para no cambiar/renombrar/eliminar colores ni tokens sin preguntar antes al usuario.

## 2026-08-01 — ProductCard estilo "Cotton Candy Sky" (rama mejoras-ux-ui)

**Qué cambió:**

- `features/catalog/product-card.tsx` rediseñado según `docs/componentes.md`: card glassy (`bg-white/80 backdrop-blur-md`, `rounded-3xl`, `shadow-xl`, borde `candy-lavender/40`), imagen al **75%** con zoom suave al hover, contenido al **25%**, título `candy-plum-dark` y subtítulo `candy-plum-muted`, y **botón "Crear" con gradiente candy animado** (`.btn-gradient-candy` nuevo en `app/globals.css`).
- Solo usa tokens de la paleta candy (`docs/colores.md`); no se tocaron los colores.
- Test existente de `ProductCard` sigue pasando (2/2).
