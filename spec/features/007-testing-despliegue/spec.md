# 007 · Testing y despliegue MVP

**Estado:** implementado ✅ (deploy efectivo documentado, pendiente credenciales)

## Qué hace

Cierra la Fase 1 (MVP) con tres frentes:

1. **E2E con Playwright del flujo completo** — navegador real contra la app levantada en local:
   - *Storefront*: home → catálogo → ficha → formulario dinámico → submit → checkout → confirmar → `/generacion/[orderId]` → `COMPLETED` (texto + preview de imagen) → descarga del `.txt` y de la imagen.
   - *Panel admin*: `/admin` sin sesión → redirect a `/admin/login`; token incorrecto → error; token correcto → dashboard; detalle de orden con `GenerationLog`; logout.
   - *404*: slug de producto y `orderId` inexistentes.
   - Con **`AI_MOCK=true`** (sin llamadas reales a Gemini/HF) y el **Inngest Dev Server local** (proceso real: `order/confirmed` → pipeline → `COMPLETED`). Base de datos: la misma Supabase de dev, con limpieza de los datos creados al final.
2. **Pruebas de integración con IA** — ya cubiertas por el smoke existente (`scripts/smoke-pipeline.test.ts` con proveedores reales); se añade una aserción de texto generado no trivial para que el modo real valide de verdad el contenido.
3. **Despliegue y QA** — CI (GitHub Actions: lint + unit + build + smoke + e2e), `vercel.json`, documentación de despliegue (`docs/despliegue-mvp.md`) y **checklist QA** (`docs/qa-checklist-mvp.md`).

## Por qué

Es la última feature del MVP (roadmap). Da confianza de que el flujo end-to-end funciona en un navegador real (los tests unit/smoke cubren piezas, no el recorrido completo con polling y descargas), automatiza el control de calidad en CI y deja la app lista para desplegar en producción con pasos verificables.

## Criterios de aceptación

- [x] `npm run test:e2e` levanta Next dev + Inngest Dev Server, corre los specs de Playwright y pasa en verde con `AI_MOCK=true`; los datos de prueba se eliminan de la BD al terminar.
- [x] El spec de storefront completa el flujo entero hasta descargar `.txt` e imagen desde `/api/resultado/[orderId]`.
- [x] El spec de admin cubre guard, login ok/ko, dashboard, detalle y logout.
- [x] Smoke de integración real verifica que el texto generado no es trivial (no solo estado).
- [x] Workflow de CI en `.github/workflows/ci.yml` ejecuta lint, unit, build, smoke y e2e; todo en verde.
- [x] `docs/despliegue-mvp.md` con pasos verificables (repositorio, Vercel, envs, migraciones, Inngest cloud) y `docs/qa-checklist-mvp.md` con la lista de verificación manual pre-lanzamiento.
- [x] `npm run lint`, `npm test` y `npm run build` siguen pasando.

## Fuera de alcance

- **Deploy efectivo en producción** — requiere cuenta Vercel/credenciales del usuario; esta feature deja CI + documentación y (si el usuario lo pide) ejecuta el deploy con sus credenciales.
- **Auth de usuarios (008)** y **storage en la nube (009)** — su integración y regresión se prueban en **011**.
- **E2E contra proveedores reales** (Gemini/HF) — costoso y flaky; la integración real se valida solo en el smoke manual. La generación E2E usa `AI_MOCK=true`.
- **Cobertura de más navegadores/móvil** — solo Chromium en este paso.
