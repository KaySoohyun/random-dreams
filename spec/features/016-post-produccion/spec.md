# 016 · Post-producción (pulido UX)

**Estado:** propuesta

## Qué hace

Una tanda de mejoras de acabado tras el MVP en producción, enfocada en la calidad percibida de la experiencia:

- **Tipografía**: reemplazar la tipografía actual (Georgia serif + Inter sans) por una nueva pareja tipográfica elegida por el usuario.
- **Aviso de pedido fallido**: cuando un pedido termina en error, avisar claramente que falló, en lugar de intentar renderizar el texto/resultado del pedido.
- **Aviso de imagen no disponible**: cuando no hay imagen disponible (falló su generación o no existe), mostrar un aviso explícito en lugar del ícono de imagen rota (alt rojo del navegador).
- **Nombre de archivos descargados**: al descargar el texto/imagen/PDF, el archivo se nombra con el formato `<slug-del-producto>-<valor-del-campo-nombre-del-form>-<fecha>` (p. ej. `mascota-epica-loki-2026-08-03.png`), en lugar de `resultado.txt`/`resultado.png`.
- **Spinners**: estados de carga consistentes con un componente `Spinner` propio en todas las acciones con espera (confirmar, reintentar, generar imagen).
- **Toasts**: notificaciones breves propias para confirmar acciones y avisar errores (descarga iniciada, reintento encolado, error de generación).
- **Favicon**: favicon de la marca (sustituye el `favicon.ico` por defecto de Next.js).

## Por qué

El MVP funciona en producción, pero tiene pulido pendiente que afecta la percepción de calidad y la confianza del usuario: la imagen rota parece un bug, un error no avisado confunde, y los archivos `resultado.txt`/`resultado.png` no permiten identificar a qué pedido corresponden. Son mejoras baratas y de alto impacto visual que cierran la "primera impresión" del producto.

## Criterios de aceptación

- [ ] La tipografía nueva está aplicada en toda la app (tokens `--font-serif`/`--font-sans` en `globals.css` y carga de fuentes en `layout.tsx`), con elección del usuario aprobada.
- [ ] Un pedido en estado `ERROR` muestra un aviso claro de fallo y **no** renderiza el texto/contenido del resultado.
- [ ] Cuando no hay imagen disponible, la página muestra un aviso explícito ("La imagen no está disponible") en lugar del ícono de imagen rota.
- [ ] Los archivos descargados se nombran `<slug>-<nombre>-<fecha>.<ext>` (fecha `YYYY-MM-DD`), consistente entre el menú de descargas, el `<img>` (inline) y el PDF.
- [ ] Existe un componente `Spinner` reutilizado en confirmar, reintentar, generar imagen y en el estado `PROCESSING`/`QUEUED` de la página de generación.
- [ ] Existe un componente `Toast` propio (sin dependencias) que confirma descargas, reintentos y muestra errores; se desvanece o cierra.
- [ ] El favicon de la marca reemplaza al default en `app/favicon.ico` (o `app/icon.*`) y se ve en la pestaña del navegador.
- [ ] `npm run lint`, `npm test` y `npm run build` pasan.

## Fuera de alcance

- **Auth / control de acceso real** — V1 (008 cancelada, 009).
- **Storage en la nube** (Supabase) y **historial/redescarga** — 009 / 010.
- **Notificaciones push/email** al terminar la generación — backlog.
- **Rediseño visual completo** (paleta, layout, componentes) — aquí solo tipografía, spinners, toasts, favicon y avisos de estado.
