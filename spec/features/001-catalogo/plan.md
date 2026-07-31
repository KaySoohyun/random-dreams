# 001 · Catálogo y selección de productos — Plan

_Cómo se implementa lo descrito en `spec.md`. Respeta `constitution/` (tech-stack: Next.js 15, Prisma + PostgreSQL/Supabase, Tailwind 4, tokens del módulo 0.3)._

## Enfoque

- **Data-driven**: los 6 productos viven en Supabase (PostgreSQL) vía Prisma; el UI no hardcodea datos. El seed alimenta la tabla `Product` con los datos exactos de `docs/0.1-definicion-producto.md`.
- **Capas**: las rutas (Server Components) delegan en `lib/services/products.ts`; el UI reutilizable vive en `features/catalog` y `components/ui`.
- **Design system del módulo 0.3** traducido a Tailwind v4 (`@theme` en `globals.css`) + `Navbar`/`Footer` en el root layout.
- **Render por request (SSR)** con Prisma: evita depender de una DB disponible en el build de CI/Vercel. La caché/ISR se difiere a 012.

## Implementación

1. **Prisma + Supabase** — `npm i -D prisma` y `npm i @prisma/client`; `npx prisma init`; definir el modelo `Product` en `prisma/schema.prisma` (módulo 0.4) y `directUrl` para migraciones (el pooler 6543 no es apto para DDL).
2. **Conexión** — `.env` ya tiene `DATABASE_URL` (pooler 6543, runtime); agregar `DIRECT_URL` (5432, migraciones) probando con `npx prisma migrate dev --name init_catalogo`.
3. **Seed** — `prisma/seed.ts` con `upsert` por `slug` de los 6 productos (formSchema, plantillas, tagline, descripción, sortOrder); script `prisma.seed` en `package.json`.
4. **Capa de datos** — `lib/db/prisma.ts` (singleton de `PrismaClient`) y `lib/services/products.ts` (`getProducts()`, `getProductBySlug(slug)`).
5. **Design system** — tokens del módulo 0.3 en `@theme` de `globals.css`; fuente Inter con `next/font/google` en `app/layout.tsx`.
6. **Layout** — `components/ui/navbar.tsx` y `components/ui/footer.tsx` en el root layout (reutilizables).
7. **Catálogo** — `features/catalog/` con `product-card.tsx`, `product-grid.tsx` y hero; página `app/(store)/page.tsx` (home = catálogo) y ruta `/catalogo` que redirige a `/`.
8. **Ficha** — `app/(store)/producto/[slug]/page.tsx` con `notFound()` para slug inexistente; CTA "Continuar" deshabilitado (feature 002).
9. **Tests** — instalar `vitest` + `happy-dom` + `@testing-library/react`; tests de estructura del seed (6 productos, slugs únicos, plantillas con placeholders) y render de `ProductCard`. Script `npm test`.
10. **Validación** — `npm run lint`, `npm run build`, `npm test`; checklist de criterios del spec; mover 001 a "Hecho" en `roadmap.md` y actualizar documentación.

## Decisiones

- **`directUrl` para migraciones** — el pooler de Supabase (6543, `pgbouncer=true`) es para transacciones en runtime; `prisma migrate` requiere conexión directa/session (5432). Se configura en el datasource y se prueba; si falla, se pide la connection string directa.
- **Home = catálogo** (sin `/catalogo` duplicado) — el wireframe 0.3 muestra el catálogo como landing; `/catalogo` solo redirige a `/` para respetar el path del nav.
- **Render por request** — simple y robusto sin DB en build; la optimización (ISR/caché) es de la feature 012. Alternativa descartada: `generateStaticParams`, que rompería el build sin DB.
- **Seed con `upsert` por `slug`** — idempotente y re-ejecutable; fuente única: `docs/0.1-definicion-producto.md`.
- **Vitest ya en 001** — tests livianos de semilla/componentes desde el inicio; Playwright E2E queda para 007 (testing del MVP).

## Riesgos

- **Conexión Supabase / pooler** — si `migrate` falla con la URL de pooler, usar `DIRECT_URL` (5432) o pedir al usuario la connection string directa del dashboard.
- **Datos sensibles** — `.env` con credenciales reales ya está ignorado por `.gitignore` (`.env*`).
- **Desincronía entre seed y docs 0.1** — los `formSchema` se copian literalmente del módulo; el test de estructura del seed detecta diferencias.
