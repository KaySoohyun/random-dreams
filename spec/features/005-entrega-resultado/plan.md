# 005 · Entrega de resultado — Plan

_Cómo se implementa lo descrito en `spec.md`. Respeta `constitution/` (MVP full-stack Next.js, polling del frontend), `docs/CONVENCIONES.md` (Server Components por defecto, Server Actions para mutaciones, Route Handlers solo para integraciones externas/storage, `next/image`) y el módulo 0.4 (`GeneratedResult`)._

## Enfoque

- **Polling con `router.refresh()`**, no endpoint JSON: sin dependencias nuevas y todo el render queda en el servidor. El componente cliente solo dispara refresh en un intervalo y decide parar por el estado que recibe como prop.
- **Servir archivos por Route Handler**, no por Server Action: la descarga es un `<a download>` nativo y el preview un `<img>`; se evita mover ~250 KB en base64 por RSC. `app/api` ya está documentado para "storage".
- **Reintento como mutación de dominio** en `lib/services` (regla de capas): el reset vive en el servicio; la acción solo orquesta evento + revalidación.

## Implementación

1. **`lib/services/generation.ts`** — agregar:
   - `retryGeneration(orderId)`: lee el `GeneratedResult`; si no existe o `aiResponseStatus !== "ERROR"` devuelve `null`/no-op; si procede, `update` con `aiResponseStatus: "QUEUED"`, `error: null`, `startedAt: null`, `completedAt: null`, contenido a `null`, `retryCount: { increment: 1 }`. Devuelve el resultado actualizado.
   - `getResultFile(orderId, formato)`: lee el `GeneratedResult`; devuelve `{ found, fileName?, contentType?, bytes? }`. Para `texto`: `textFileName` + `textContent` + `text/plain; charset=utf-8`. Para `imagen`: `imageFileName` + `imageBytes` + content-type derivado por extensión (`image/png`/`image/jpeg`). Si falta el resultado o los bytes → `found: false`.
2. **Route Handler `app/api/resultado/[orderId]/route.ts`** — `GET`: parsea `formato` (zod: `texto` | `imagen`) y `descarga`; llama `getResultFile`; `found: false` → 404; si `descarga=1` → `Content-Disposition: attachment; filename="..."`; responde con los bytes y content-type.
3. **`features/result/actions.ts`** — `retryGenerationAction(orderId)`: llama `retryGeneration`; si no hubo retry (no-op) → `revalidatePath` y salir; si hubo → `sendOrderConfirmed(orderId)` (try/catch con `console.warn`, mismo patrón que `confirmOrderAction`) y `redirect("/generacion/<orderId>")`.
4. **`features/result/auto-refresh.tsx`** — componente cliente `AutoRefresh({ status })`: si `status === "COMPLETED" || status === "ERROR"` no renderiza nada; si no, `useEffect` con `setInterval(() => router.refresh(), 3000)` y cleanup.
5. **`app/(store)/generacion/[orderId]/page.tsx`** — reescribir:
   - `generateMetadata` con el nombre del producto (dinámico).
   - `QUEUED`/`PROCESSING`: card con estado + `<AutoRefresh status>`.
   - `COMPLETED`: card con el texto (pre-wrap), preview de imagen con `next/image` (`fill` + `object-contain` en contenedor `aspect-[4/3]` relativo, mismo-origin sin `remotePatterns`) y dos botones de descarga (`<a href="/api/resultado/[orderId]?formato=texto&descarga=1" download>` y lo mismo con `formato=imagen`). Si faltan bytes de imagen, mostrar "imagen no disponible" sin romper.
   - `ERROR`: mensaje (`generatedResult.error`) + botón "Reintentar" que llama a `retryGenerationAction` (form).
   - Sin `GeneratedResult` → `notFound()`.
6. **Tests unitarios** (mock prisma, nunca llamadas reales):
   - `retryGeneration`: desde `ERROR` resetea e incrementa `retryCount`; desde `COMPLETED`/`PROCESSING`/`QUEUED` no-op; resultado inexistente → no-op.
   - `getResultFile`: `texto` e `imagen` devuelven nombre/content-type/bytes correctos; faltante → `found: false`.
7. **Validación** — `npm run lint`, `npm test`, `npm run build`. Smoke (extender `scripts/smoke-pipeline.test.ts` o nuevo `smoke-result.test.ts` con `AI_MOCK=true`): confirmar → pipeline → `getResultFile` devuelve `resultado.txt` (text/plain) y `resultado.png` (image/png); limpiar datos.
8. **Docs** — mover 005 a "Hecho" en `roadmap.md`, agregar entrada en `docs/CAMBIOS.md`, y nota breve en `docs/ARQUITECTURA.md`/`CONVENCIONES.md` sobre el route handler de resultados y el polling.

## Decisiones

- **`router.refresh()` en vez de endpoint JSON de estado**: sin dependencias, render siempre en servidor, y la transición de estado desmonta el poller por sí sola. Contrapartida: cada refresh re-ejecuta la página (barato: una lectura de `GeneratedResult`).
- **Route Handler para servir archivos** aunque la regla diga "solo integraciones externas": `app/api` está documentado con "storage" y este handler entrega bytes al navegador (descarga/preview), no expone lógica de dominio; todo el negocio (qué devolver, content-type) vive en `lib/services`.
- **`next/image` con `fill` + `object-contain`** porque no se conocen las dimensiones intrínsecas (fal-ai ~1024×768, mock 1×1); `fill` evita distorsión y CLS. Si `next/image` diera problemas con la ruta dinámica same-origin, fallback documentado a `<img>` plano.
- **Reintento = regeneración completa**: desde `ERROR` no hay resultado parcial utilizable; la pipeline es idempotente por `orderId` y vuelve a escribir logs (trazabilidad intacta).
- **`retryCount` ya existe** en `GeneratedResult` (módulo 0.4) → no hace falta migración.
- **Acceso por `orderId` cuid** en MVP: no adivinable, pero sin auth; el hardening (auth + URLs firmadas) es V1 (008/009). Se documenta en el spec.

## Riesgos

- **Inngest dev apagado** → el estado se queda en `QUEUED` indefinidamente (igual que el flujo inicial de 004). El smoke test ejecuta la pipeline directa para no depender del CLI.
- **`router.refresh()` no se testea en Vitest** → la lógica testeable (retry, servido de archivos) va en `lib/services` con unit tests; el polling se valida manualmente y en Playwright (007).
- **`next/image` con la ruta same-origin** → si no optimiza, se evalúa `<img>` plano (decisión documentada).
