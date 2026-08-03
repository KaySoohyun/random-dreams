# 016 · Post-producción (pulido UX) — Tareas

_Checklist accionable derivada de `plan.md`._

- [ ] **Tipografía** (bloqueada hasta elección del usuario): cargar la pareja tipográfica en `app/layout.tsx` y mapear `--font-sans`/`--font-serif` en `@theme` de `app/globals.css`; actualizar `body { font-family }` y la sección Tipografía de `docs/colores.md`.
- [ ] **Aviso de pedido fallido**: en `app/(store)/generacion/[orderId]/page.tsx`, garantizar que con `aiResponseStatus === "ERROR"` solo se muestre la notificación de fallo + `error` + `RetryForm`, nunca el `textContent`/markdown (guard en el branch `COMPLETED`).
- [ ] **Aviso de imagen no disponible**: crear `features/result/result-image.tsx` (cliente, wrapper de `next/image` con estado de carga/error) y reemplazar el `Image` directo; si faltan bytes o `onError`, mostrar placeholder "La imagen no está disponible".
- [ ] **Nombres de archivo** `lib/services/generation.ts`: helper `buildResultFileName` (slugify `<slug>-<campo-nombre>-<fecha>`, fecha `YYYY-MM-DD`, extensión por formato/bytes) + `getResultFile` leyendo `product`/`formSubmission` para armar el `fileName`.
- [ ] **Nombres de archivo** route handler `app/api/resultado/[orderId]/route.ts`: aplicar el nombre real también para `formato=pdf` (hoy fijo `resultado.pdf`).
- [ ] **Convención campo nombre**: confirmar con el usuario = primer campo `text` del `formSchema` (documentar caso `formula-de-emociones` sin campo text → solo `<slug>-<fecha>`).
- [x] **Spinners**: crear `components/ui/spinner.tsx`; reemplazar el spinner inline de la página de generación y usarlo en botones `pending` (`ConfirmForm`, `RetryForm`, `ImageGenerateForm`).
- [x] **Toasts**: crear `components/ui/toast.tsx` (provider + `useToast`, botón de cierre) y montarlo en `app/layout.tsx`.
- [x] **Toasts — disparos**: `DownloadMenu` ("Descarga iniciada"), `RetryForm`/`ImageGenerateForm`/`ConfirmForm` (confirmación/error vía `useActionState`), página de generación en `ERROR` (`ErrorToast`).
- [ ] **Favicon**: reemplazar `app/favicon.ico` (o añadir `app/icon.svg`) con favicon gold-night de marca; verificar en la pestaña.
- [ ] **Tests**: unit de `buildResultFileName`/`getResultFile` (slug, nombre con acentos, sin campo text, fecha, extensiones); ajustar `tests/e2e/storefront.spec.ts` si asume `resultado.txt`/`resultado.png`.
- [ ] **Validación**: `npm run lint`, `npm test`, `npm run build`; smoke manual `AI_MOCK=true` (COMPLETED → descarga con nombre nuevo; ERROR → aviso sin texto; sin imagen → placeholder).
- [ ] **Docs**: `docs/CAMBIOS.md`, nota en `docs/ARQUITECTURA.md`/`docs/CONVENCIONES.md`, y mover 016 a "Hecho" en `../../constitution/roadmap.md`.
