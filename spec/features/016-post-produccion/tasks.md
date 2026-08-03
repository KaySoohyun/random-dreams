# 016 · Post-producción (pulido UX) — Tareas

_Checklist accionable derivada de `plan.md`._

- [x] **Tipografía**: cargada en `app/layout.tsx` con `next/font/google` — **Domine** para títulos (`--font-serif`) y **Faculty Glyphic** para el cuerpo (`--font-body`), más Inter (`--font-sans`); mapeadas en `@theme` de `app/globals.css`; actualizado `body { font-family }` y la sección Tipografía de `docs/colores.md`.
- [x] **Aviso de pedido fallido**: en `app/(store)/generacion/[orderId]/page.tsx`, garantizar que con `aiResponseStatus === "ERROR"` solo se muestre la notificación de fallo + `error` + `RetryForm`, nunca el `textContent`/markdown (guard en el branch `COMPLETED`).
- [x] **Aviso de imagen no disponible**: crear `features/result/result-image.tsx` (cliente, wrapper de `<img>` nativo con estado de carga/error) y reemplazar el `Image` directo; si faltan bytes o `onError`, mostrar placeholder "La imagen no está disponible".
- [x] **Aviso de imagen no disponible — verificación manual**: el mock ya no genera imagen por defecto (`AI_IMAGE_OK=false`), así que con `AI_MOCK=true` el pedido queda COMPLETED con texto y la página muestra el placeholder "Imagen no disponible"; el menú de descargas muestra el item Imagen deshabilitado con tooltip "No disponible" (sin botón de generarla a demanda); `AI_IMAGE_OK=true` fuerza la imagen placeholder para flujos felices.
- [x] **Nombres de archivo** `lib/services/generation.ts`: helper `buildResultFileName` (slugify `<slug>-<campo-nombre>-<fecha>`, fecha `YYYY-MM-DD`, extensión por formato/bytes) + `getResultFile`/`getResultFileName` leyendo `product`/`formSubmission` para armar el `fileName`.
- [x] **Nombres de archivo** route handler `app/api/resultado/[orderId]/route.ts`: aplicar el nombre real también para `formato=pdf` (fallback `resultado.pdf`).
- [x] **Convención campo nombre**: confirmado con el usuario = primer campo `text` del `formSchema` (documentado caso `formula-de-emociones` sin campo text → solo `<slug>-<fecha>`); fecha de hoy al descargar (YYYY-MM-DD local).
- [x] **Spinners**: crear `components/ui/spinner.tsx`; reemplazar el spinner inline de la página de generación y usarlo en botones `pending` (`ConfirmForm`, `RetryForm`, `ImageGenerateForm`).
- [x] **Toasts**: crear `components/ui/toast.tsx` (provider + `useToast`, botón de cierre) y montarlo en `app/layout.tsx`.
- [x] **Toasts — disparos**: `DownloadMenu` ("Descarga iniciada"), `RetryForm`/`ImageGenerateForm`/`ConfirmForm` (confirmación/error vía `useActionState`), página de generación en `ERROR` (`ErrorToast`).
- [x] **Favicon**: logo de marca en la navbar (`/assets/logo.png`, reemplaza ícono ✧ + textos) y favicon gold-night en `public/favicon/` (favicon.ico, 16/32, apple-touch, android-chrome + `site.webmanifest` con nombre/theme `#0b0f14`); metadata `manifest`/`icons` en `app/layout.tsx`, eliminado `app/favicon.ico` por defecto; verificado en la pestaña (200).
- [x] **Tests**: unit de `buildResultFileName`/`getResultFileName` (slug, nombre con acentos, sin campo text, fecha, extensiones); ajustado `tests/e2e/storefront.spec.ts` (antes asumía `resultado.txt`/`resultado.png`).
- [x] **Validación**: `npm run lint` (0 errores), `npm test` (144/144), `npm run build` OK; favicon/íconos servidos (200) y `<link rel="icon">` verificado en el HTML servido. Smoke manual `AI_MOCK=true` queda pendiente de revisión visual del usuario (logo en navbar + pestaña).
- [ ] **Docs**: `docs/CAMBIOS.md`, nota en `docs/ARQUITECTURA.md`/`docs/CONVENCIONES.md`, y mover 016 a "Hecho" en `../../constitution/roadmap.md`.
