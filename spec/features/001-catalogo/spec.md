# 001 · Catálogo y selección de productos

**Estado:** propuesta

## Qué hace

- El home (`/`) muestra el **catálogo** con los 6 productos de Random Dreams, leídos de la base de datos (`Product`): tarjeta con ilustración (placeholder), nombre, tagline y botón "Crear".
- Cada tarjeta navega a la **ficha de detalle** `/producto/[slug]` con la descripción del producto, cómo se usa y qué obtiene el usuario (texto `.txt` + imagen `.png`).
- El botón "Continuar" de la ficha aparece **deshabilitado**: el formulario dinámico llega en la feature 002.

## Por qué

Es la puerta de entrada del producto: el usuario elige entre las 6 "realidades" que ofrece la plataforma. Además, sentar la base técnica (Prisma + Supabase + seed + design system en Tailwind v4) es requisito para todas las features siguientes.

## Criterios de aceptación

- [ ] `/` muestra los 6 productos (nombre, tagline, CTA) leídos de la tabla `Product` y ordenados por `sortOrder`; ningún dato hardcodeado en los componentes.
- [ ] Cada tarjeta navega a `/producto/[slug]`; la ficha muestra nombre, descripción, qué se obtiene y CTA "Continuar" deshabilitado.
- [ ] `/producto/slug-inexistente` responde **404**.
- [ ] El seed (`npm run seed`) es **idempotente**: re-ejecutarlo no duplica productos.
- [ ] Diseño según módulo 0.3: neutral minimalista, tokens en `globals.css` (@theme), grid responsive 1/2/3 columnas, imágenes con `alt`, foco visible y navegación por teclado.
- [ ] `npm run lint` y `npm run build` pasan; los tests (`npm test`) de seed y de componentes quedan verdes.

## Fuera de alcance

- **Formulario dinámico** y validación Zod — feature **002** (por eso "Continuar" está deshabilitado).
- Checkout, generación y resultado — features **003–005**.
- Ilustraciones reales de las tarjetas (placeholder en MVP; el campo `Product.imageUrl` ya queda definido).
- Caché/ISR del catálogo — se difiere a **012** (optimización).
