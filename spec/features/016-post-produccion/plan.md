# 016 · Post-producción (pulido UX) — Plan

_Mejoras de acabado sobre el MVP en producción. Respeta `docs/colores.md` (la paleta no se toca), `docs/CONVENCIONES.md` (Server Components por defecto, client solo donde hace falta, sin dependencias nuevas), el design system de `globals.css` (`@theme` + `@layer components`) y el flujo SDD (spec → plan → tasks → código)._

## Enfoque

- **Todo con componentes propios y Tailwind**, sin librerías: `Spinner` y `Toast` caseros, consistentes con los tokens gold-night. Las Server Actions ya usan `useActionState`/`useFormStatus`; los toasts se disparan desde el cliente (provider en el layout raíz).
- **El nombre de archivo se decide en `lib/services`** (regla de capas): `getResultFile` y la ruta PDF arman el nombre con `<slug>-<campo-nombre>-<fecha>`; la UI solo consume el `Content-Disposition`.
- **Los avisos de estado (fallo del pedido / imagen no disponible) son guardas de render** en la página de generación, no cambios de dominio.
- **Tipografía**: se reemplazan los tokens y la carga de fuentes una vez que el usuario elija la pareja tipográfica (decisión pendiente, fuera de mi criterio).

## Implementación

1. **Tipografía** — Cuando el usuario defina las fuentes: cargar la pareja en `app/layout.tsx` (patrón actual con `next/font/google`, reemplazando `Inter`), mapear a `--font-sans`/`--font-serif` en `@theme` de `app/globals.css`, actualizar `body { font-family }` y la sección Tipografía de `docs/colores.md`. No tocar colores.
2. **Aviso de pedido fallido** — En `app/(store)/generacion/[orderId]/page.tsx`: el branch `ERROR` muestra solo la notificación de fallo + `error` + `RetryForm`, y se garantiza que nunca se renderice el `textContent`/markdown cuando `aiResponseStatus === "ERROR"` (guard `status === "COMPLETED"`). Añadir un `onError`/guard adicional por si hubiera contenido residual tras un retry.
3. **Aviso de imagen no disponible** — Componente cliente `features/result/result-image.tsx` que envuelve `next/image` con estado de carga/error: si la imagen falta (`imageBytes` null) o el `onError` del `<img>` dispara (imagen rota), muestra un placeholder "La imagen no está disponible" con ícono, en vez del ícono rojo del navegador. Reemplaza el `Image` directo en la página de generación.
4. **Nombre de archivos descargados** — En `lib/services/generation.ts`:
   - Helper `buildResultFileName(result, order, formato)` → `slugify("<product-slug>-<valor-campo-nombre>-YYYY-MM-DD")` con la fecha de `completedAt` (o `createdAt`), slug de la parte nombre normalizado (sin acentos, espacios → `-`), extensión por formato/bytes (`imageFileNameFor`, `.txt`, `.pdf`).
   - `getResultFile(orderId, formato)`: además del `GeneratedResult`, lee `product` (slug) y `formSubmission` (valor del campo nombre) para armar el `fileName`.
   - Route Handler `app/api/resultado/[orderId]/route.ts`: aplicar el mismo nombre para `formato=pdf` (hoy fijo `resultado.pdf`) y texto/imagen via `getResultFile`. El `<img>` inline sigue sin `descarga=1` (no importa el filename).
   - **Campo nombre**: convención = primer campo `text` del `formSchema` del producto (p. ej. `nombre`, `nombre_criatura`, `nombre_mascota`); si el producto no tiene campo text (p. ej. `formula-de-emociones`, primer campo `anio` number), se usa solo `<slug>-<fecha>` y se documenta. Confirmar esta convención con el usuario al implementar.
5. **Spinners** — `components/ui/spinner.tsx` (`Spinner` con anillo giratorio gold-night, `aria-label`). Reemplazar el spinner inline actual de la página de generación y usarlo dentro de los botones `pending` (`ConfirmForm`, `RetryForm`, `ImageGenerateForm`) junto al texto existente.
6. **Toasts** — `components/ui/toast.tsx`: provider cliente (`ToastProvider` + `useToast`) montado en `app/layout.tsx` (sobre el `body`), lista de toasts apilada arriba-derecha con animación, `auto-dismiss` y botón de cierre. Disparos:
   - `features/result/download-menu.tsx`: toast "Descarga iniciada" al hacer click en una opción.
   - `features/result/retry-form.tsx` / `ImageGenerateForm` / `ConfirmForm`: toast de confirmación/error según resultado de la acción (vía `useActionState`).
   - Página de generación: toast de error si el estado es `ERROR`.
7. **Favicon** — Reemplazar `app/favicon.ico` (o añadir `app/icon.svg`) con un favicon de marca gold-night (motivo ✧/dorado sobre fondo oscuro, coherente con el logo del navbar), y verificar en la pestaña.
8. **Validación** — `npm run lint`, `npm test`, `npm run build`. Smoke manual en dev (`AI_MOCK=true`): pedido COMPLETED → descarga con nombre `<slug>-<nombre>-<fecha>.<ext>`; pedido ERROR → aviso de fallo sin texto; sin imagen → placeholder. E2E `tests/e2e/` existentes siguen en verde (ajustar aserciones de filename si aplica).
9. **Docs** — Actualizar `docs/CAMBIOS.md`, nota breve en `docs/ARQUITECTURA.md`/`docs/CONVENCIONES.md` (nombre de archivos, componentes UI nuevos), sección Tipografía de `docs/colores.md`, y mover 016 a "Hecho" en `roadmap.md`.

## Decisiones

- **Componentes propios (Spinner/Toast) sin librerías** — el design system ya es tokenizado; `sonner` etc. añaden dependencia y estilo foráneo. El usuario confirmó "Propios, sin dependencias".
- **Nombre de archivo en `lib/services`, no en la UI** — respeta la regla de capas y mantiene el `Content-Disposition` como fuente única; la UI usa `<a download>` nativo sin saber el nombre.
- **Campo nombre por convención (primer campo text)** — sin migración ni cambio de schema; se documenta el caso sin campo text. Alternativa descartada: agregar un flag `isName` al `formSchema` (más preciso pero toca los 6 seeds y la validación).
- **Toast con provider en el layout raíz** — disponible en toda la app sin prop-drilling; los Server Components siguen siendo la norma, el provider es solo un wrapper cliente.
- **Avisos de imagen/pedido como guardas de render** — cambios acotados a la página de generación, sin tocar el dominio ni el pipeline.

## Riesgos

- **`next/image` no da `onError`** directamente con `fill` — por eso el wrapper cliente propio; si `next/image` falla al servir la ruta dinámica, el `onError` del `<img>` nativo dentro del wrapper captura el fallo y muestra el placeholder.
- **Nombre de archivo con caracteres especiales** (acentos, espacios, `/`) — el slugify sanitiza; probar con un valor de formulario real (p. ej. "Fénix del Pantano").
- **E2E dependen del filename** — `tests/e2e/storefront.spec.ts` puede asertar `resultado.txt`/`resultado.png`; hay que actualizarlo al nuevo naming y validar en CI.
- **Tipografía pendiente de elección del usuario** — la tarea queda bloqueada hasta la decisión; no se elige fuente sin su OK.
