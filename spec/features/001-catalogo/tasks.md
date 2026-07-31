# 001 · Catálogo y selección de productos — Tareas

_Checklist derivada de `plan.md`._

- [x] Instalar `prisma` (dev) y `@prisma/client`; `prisma init` y modelo `Product` en `prisma/schema.prisma` (Prisma 7: config en `prisma.config.ts`, driver adapter).
- [x] Agregar `DIRECT_URL` al `.env`; correr `npx prisma migrate dev --name init_catalogo`.
- [x] Escribir `prisma/seed.ts` (6 productos con `upsert` por `slug`, datos de `docs/0.1`) y script `npm run seed`.
- [x] Crear `lib/db/prisma.ts` (singleton) y `lib/services/products.ts` (`getProducts`, `getProductBySlug`).
- [x] Traducir tokens del módulo 0.3 a `@theme` en `globals.css`; fuente Inter en `app/layout.tsx`.
- [x] Crear `components/ui/navbar.tsx` y `components/ui/footer.tsx` y montarlos en el root layout.
- [x] Crear `features/catalog/` (product-card, product-grid, hero).
- [x] Implementar home (`app/(store)/page.tsx`) y ruta `/catalogo` (redirect).
- [x] Implementar ficha `app/(store)/producto/[slug]/page.tsx` con `notFound()` y CTA deshabilitado.
- [x] Instalar `vitest` + `happy-dom` + `@testing-library/react`; tests de seed y de `ProductCard`; script `npm test`.
- [x] Correr `npm run lint`, `npm test` y `npm run build`.
- [x] Validar contra los criterios de aceptación de `spec.md`.
- [x] Mover 001 a "Hecho" en `../../constitution/roadmap.md` y actualizar documentación.

## Mantenimiento (checklist recurrente)

- [ ] Al cambiar `docs/0.1-definicion-producto.md`: re-ejecutar `npm run seed` y el test de estructura del seed.
