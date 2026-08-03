# 017 · Flujo sin base de datos

**Estado:** propuesta

## Qué hace

Quita la base de datos del flujo principal del usuario (home → formulario → checkout → generación → resultado → descargas). El catálogo pasa a ser **estático** (en código), y el pedido con su resultado viven **en memoria del servidor** (Map global con TTL). La generación se mantiene **asíncrona en memoria** (sin Trigger.dev Cloud) y el polling existente (`router.refresh()` cada 3 s) lee del store de memoria.

Decisiones tomadas con el usuario:

- **Estado del pedido:** en memoria del servidor.
- **Resultado generado (texto + imagen):** en memoria del servidor, servido desde `/api/resultado/[orderId]`.
- **Generación:** se mantiene el patrón asíncrono con polling, pero corriendo en el proceso del servidor (fire-and-forget) en vez de Trigger.dev.

## Por qué

La transición entre páginas (home → formulario → checkout) tarda ~1.35 s porque **cada página lee de una base de datos remota** (Supabase en Canadá, ~190-200 ms por query de ida y vuelta, varios round trips por render). El catálogo y los pedidos no necesitan persistencia hoy: eliminar la BD del camino del usuario hace que las navegaciones no dependan de la latencia de red, y simplifica el stack del MVP.

## Cómo

- **`lib/data/products.ts`** — los 6 productos tipados como constantes (reusando el contenido de `prisma/seed-data.ts`). `id = slug`.
- **`lib/store/orders.ts`** — store en memoria con TTL (24 h) y limpieza perezosa: `createPendingOrder`, `getCheckoutOrder`, `getOrderById`, `getOrderGeneration`, `getOrderForGeneration`, `confirmOrder`, más las de generación (`setProcessing`, `saveText`, `saveImage`, `markCompleted`, `markError`, `retryGeneration`, `getResultText`, `getResultFile`, `logStep`).
- **`lib/services/products.ts`** — lee del catálogo estático (mismas firmas: `getProducts`, `getProductBySlug`, `getProductById`).
- **`lib/services/orders.ts`** y **`lib/services/generation.ts`** — usan el store en memoria (mismas firmas; el `product` se resuelve desde el catálogo).
- **`trigger/events.ts`** — `enqueueGeneration` lanza `runGenerationInline` en background (fire-and-forget) en vez de `tasks.trigger`. La firma no cambia: las Server Actions quedan intactas.
- **`trigger/pipeline.ts`** — sin cambios (sigue llamando a `lib/services/generation.ts`, que ahora es memoria).
- **`app/api/resultado/[orderId]/route.ts`** — sin cambios (ya delega en `getResultFile`/`getResultText`).
- **`app/(store)/**`** — sin cambios de código (siguen llamando a los servicios con las mismas firmas).
- **Admin** (V2, `lib/services/admin.ts`) — **fuera de alcance**: sigue usando Prisma. El `prisma/` y `lib/db/prisma.ts` se mantienen para eso.

## Criterios de aceptación

- [ ] Navegar home → formulario → checkout no hace ninguna query a la BD (verificable con logs de Prisma desactivados / sin `DATABASE_URL`).
- [ ] Completar el formulario crea el pedido en memoria y redirige a `/checkout/[orderId]`; confirmarlo genera el resultado (texto + imagen) en memoria y redirige a `/generacion/[orderId]`.
- [ ] La página de generación muestra los estados `QUEUED/PROCESSING/COMPLETED/ERROR` vía polling sin tocar la BD.
- [ ] Descargas de texto, imagen y PDF funcionan desde memoria vía `/api/resultado/[orderId]`.
- [ ] El botón "reintentar" desde `ERROR` resetea a `QUEUED` y vuelve a generar en memoria.
- [ ] El store expira pedidos viejos (TTL) para no crecer sin límite.
- [ ] `npm run lint`, `npm test` y `npm run build` pasan.

## Limitaciones aceptadas

- Sin BD ni storage, un **refresh pierde el pedido** si el proceso del servidor se reinicia o redepliega (estado solo en memoria).
- **No funciona en Vercel serverless** con más de una instancia / cold start: la generación fire-and-forget muere al terminar el request. Adecuado para dev/local y para un despliegue de una sola instancia con generación síncrona como respaldo.
- Trigger.dev queda desactivado para el flujo principal (no puede leer memoria del servidor).

## Fuera de alcance

- **Admin** (V2) — sigue con Prisma.
- **Auth, storage en la nube, historial** — 008/009/010.
- **Quitar Prisma del proyecto** (desinstalar, borrar migraciones) — se mantiene por admin; se puede reevaluar en V1.
- **Cambios de UI** — la UI no cambia.
