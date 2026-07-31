# 005 · Entrega de resultado — Tareas

_Checklist derivada de `plan.md`._

- [x] `lib/services/generation.ts`: `retryGeneration(orderId)` — solo desde `ERROR`; reset a `QUEUED` + limpieza + `retryCount + 1`.
- [x] `lib/services/generation.ts`: `getResultFile(orderId, formato)` — texto/imagen, content-type por extensión, `found: false` si falta.
- [x] Route Handler `app/api/resultado/[orderId]/route.ts` — `?formato=texto|imagen`, `&descarga=1` → 200/404, `Content-Disposition`.
- [x] `features/result/actions.ts`: `retryGenerationAction` (servicio + `sendOrderConfirmed` + `redirect`).
- [x] `features/result/auto-refresh.tsx`: cliente, `router.refresh()` cada 3 s salvo `COMPLETED`/`ERROR`.
- [x] Reescribir `app/(store)/generacion/[orderId]/page.tsx`: estados, preview `next/image`, descargas, botón reintento, 404.
- [x] Tests unitarios: `retryGeneration` (solo ERROR, reset, `retryCount`) y `getResultFile` (tipos, content-types, faltante).
- [x] Correr `npm run lint`, `npm test` y `npm run build`.
- [x] Smoke test (`AI_MOCK=true` y `false`): confirmar → pipeline → `getResultFile` devuelve `.txt` y `.png`/`.jpg` con content-types correctos; datos limpiados.
- [x] Mover 005 a "Hecho" en `../../constitution/roadmap.md`, entrada en `docs/CAMBIOS.md` y nota en `docs/ARQUITECTURA.md`/`docs/CONVENCIONES.md`.
