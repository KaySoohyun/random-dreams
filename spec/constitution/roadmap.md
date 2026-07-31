# Roadmap

Orden y estado de las features. Es la vista de "qué hay hecho, qué toca ahora y qué viene". Cada entrada apunta a su carpeta en `features/`. Basado en `docs/ARQUITECTURA.md`, `docs/CONVENCIONES.md` y `ia-tools/plan-ejecucion.md`.

## Hecho ✅

1. **Fase 0 · Descubrimiento y Diseño** — Los 6 productos con su `form_schema` y plantillas (`docs/0.1-definicion-producto.md`), arquitectura técnica y contrato de IA (`docs/0.2-arquitectura-tecnica.md`, `docs/contrato-ia.md`), diseño UX/UI y prototipo (`docs/0.3-diseno-ux-ui.md`, `prototype/`), y modelado de datos (`docs/0.4-modelado-de-datos.md`).
2. **001 · Catálogo y selección** — Listado de los 6 productos data-driven (Prisma/Supabase + seed), ficha de detalle `/producto/[slug]` y selección única. Spec: `features/001-catalogo/`.
3. **002 · Formulario dinámico** — Motor de formularios configurable por `Product.formSchema`, validación Zod frontend + backend, persistencia de la respuesta (`FormSubmission`) y creación de `Order` PENDING. Spec: `features/002-formulario-dinamico/`.
4. **003 · Checkout sin pasarela** — Confirmación unitaria: `Order.paymentStatus` `pending → approved`, `confirmedAt`, creación de `GeneratedResult` (QUEUED) y stub de `/generacion/[orderId]`. Spec: `features/003-checkout/`.
5. **004 · Pipeline de generación IA** — Orquestación Inngest v4 (`order/confirmed`): `GENERATE_TEXT` (Gemini compone texto y prompt de imagen) → `GENERATE_IMAGE` (FLUX.1-schnell vía HF) → `UPLOAD_RESULT` → `MARK_COMPLETED`, con reintentos (5), timeouts, estados `queued/processing/completed/error` y trazabilidad en `GenerationLog`. `AI_MOCK` para dev/CI. Spec: `features/004-pipeline-ia/`.
6. **005 · Entrega de resultado** — `/generacion/[orderId]` con polling (`router.refresh()` cada 3 s), vista del resultado (texto + preview `next/image`) y descarga directa del `.txt` y la imagen vía `/api/resultado/[orderId]`; botón de reintento desde `ERROR` (resetea a `QUEUED` + `retryCount`). Spec: `features/005-entrega-resultado/`.
7. **006 · Backend core** — Panel admin/soporte `/admin` con token (`ADMIN_TOKEN`): login con cookie de sesión firmada, dashboard con conteos, gestión de órdenes (listado/filtros/detalle) y trazabilidad `GenerationLog`, con reintento desde `ERROR`. Sin API REST (constitución). Spec: `features/006-backend-core/`.
8. **007 · Testing y despliegue MVP** — E2E Playwright del flujo completo (storefront hasta descargas + panel admin + 404s) con Next dev + Inngest Dev Server y `AI_MOCK=true`; aserción no trivial en el smoke real; CI en GitHub Actions (lint/unit/build/smoke/e2e); `docs/despliegue-mvp.md` y `docs/qa-checklist-mvp.md`. Deploy efectivo preparado (sin credenciales Vercel en el entorno). Spec: `features/007-testing-despliegue/`.

## Siguiente 🔜

_(MVP completo — siguiente fase: **V1**.)_

## Backlog / ideas 💡

### V1 (Fase 2)

- **008 · Autenticación y cuenta** — Registro/login (email + OAuth opcional), recuperación de contraseña, perfil; `Order.userId` obligatorio.
- **009 · Storage en la nube** — Supabase Storage (tier gratuito), subida automática del resultado, nombrado por `usuario/orden`, política de retención (`StorageAsset.expiresAt`).
- **010 · Historial de generaciones** — Panel de usuario con historial y redescarga de resultados previos.
- **011 · Testing y despliegue V1** — Integración auth + storage + historial, regresión sobre MVP, feature flags.

### V2 (Fase 3)

- **012 · Optimización y escalabilidad** — Caché de prompts, concurrencia del pipeline, limpieza/expiración de archivos, monitoreo y alertas.
- **013 · Seguridad y cumplimiento** — Hardening de auth (roles/permisos), manejo de datos personales de formularios, retención de archivos (GDPR).
- **014 · Analítica de producto** — Instrumentación de eventos (selección, formulario, confirmación, generación, descarga) y dashboard de conversión.
- **015 · Extensibilidad de catálogo** — Incorporar nuevos productos sin cambios estructurales y panel admin de productos/formularios.

> Cada feature nueva se crea como `features/NNN-nombre-feature/` con `spec.md`, `plan.md` y `tasks.md` antes de tocar código.
