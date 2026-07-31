# 008 · Autenticación y cuenta — Plan

_Cómo se implementa lo descrito en `spec.md`. Respeta `docs/CONVENCIONES.md` y el stack (Auth.js/NextAuth en el tech-stack). El dominio vive en `lib/services` sin imports de `next/*`; las Server Actions solo orquestan._

## Enfoque

- **Auth.js v5 (NextAuth) + Credentials + sesiones JWT** — sin DB adapter (Credentials + adapter no se soportan bien en v5); la sesión JWT lleva el `id` de usuario. Se extiende el tipado con `next-auth.d.ts` (`session.user.id`).
- **bcryptjs** para el hash — 100% JS, sin build nativa → compatible con las restricciones de `npm install-scripts` del entorno.
- **Guard por layout + Server Actions** (patrón ya usado en admin): `app/cuenta/layout.tsx` llama `auth()` y redirige; las acciones re-verifican la sesión. **Sin middleware edge** (bcrypt no corre en edge y no hace falta).
- **Ownership centralizado** — las funciones de dominio reciben `userId` y lo filtran en la query; el Route Handler `/api/resultado` lee la sesión con `auth()`.

## Implementación

1. **Dependencias (pedir OK antes de instalar)** — `next-auth@^5` (estable; incluye `@auth/core`) y `bcryptjs`. Env nueva: `AUTH_SECRET` (`openssl rand -base64 32`) en `.env`, `.env.example` y producción Vercel.
2. **Schema + migración** — modelo `User` (`id` cuid, `email` único, `passwordHash`, `createdAt`/`updatedAt`); `Order.userId` pasa a `String` requerido con relación `User 1:N Order` y `@@index([userId])`. `npx prisma migrate dev --name add_user_orders` + `npx prisma generate`.
3. **Auth.js** — `auth.config.ts` (config edge-safe sin providers) + `auth.ts` (unión de config + `Credentials` con `authorize`: `getUserByEmail` + `bcryptjs.compare`) + `app/api/auth/[...nextauth]/route.ts` + `next-auth.d.ts`.
4. **Dominio** `lib/services/users.ts` — `createUser({ email, password })` (hash con bcryptjs, manejo de email duplicado), `getUserByEmail`, `verifyCredentials(email, password)`. Capa pura, sin `next/*`.
5. **Actions** `features/auth/actions.ts` — `registerUserAction` (zod: email válido + password ≥ 8; crea usuario y `signIn("credentials", { redirect: false })`), `loginAction` (zod + `signIn` con `redirect: false`, error genérico "Credenciales inválidas"), `logoutAction` (`signOut`). Formularios `features/auth/*-form.tsx` con `useActionState`.
6. **Rutas** — `app/(auth)/login/page.tsx`, `app/(auth)/registro/page.tsx`; `app/cuenta/layout.tsx` (guard con `auth()` → `redirect("/login?next=...")`), `app/cuenta/perfil/page.tsx`.
7. **Ordenes con dueño** — `createPendingOrder({ productId, userId, formData })`; `features/forms/actions.ts` obtiene la sesión (`auth()`) y redirige a `/login` si no hay. `confirmOrder(orderId, userId)`, `getCheckoutOrder(id, userId)`, `getOrderGeneration(id, userId)`, `retryGeneration(orderId, userId)` y `getResultFile(orderId, formato, userId)` filtran por dueño (no dueño → `found: false`/null → 404). `app/api/resultado/[orderId]/route.ts` usa `auth()` + ownership.
8. **Tests** — unit: `users-service.test.ts` (hash, verify, duplicado), `auth-actions.test.ts` (mocks de `signIn`/`signOut`/`auth()`), actualizar `orders-service.test.ts`/`generation-service.test.ts`/`admin-actions.test.ts` a las firmas con `userId`. E2E: `e2e/auth.spec.ts` (registro, login ok/ko, logout, guard `/cuenta`, ownership: usuario B → 404 en orden de usuario A); `e2e/storefront.spec.ts` reescrito al flujo logueado (registro en `beforeAll`); `e2e/helpers/db.ts`: `createUser`/`cleanupUser` y `createOrderForAdmin` con `userId`.
9. **Smoke** — `scripts/smoke-auth.test.ts` (opcional): ciclo real registro→login→logout contra la BD dev con `AI_MOCK=true`. Si agrega complejidad, lo cubre el E2E y se omite.
10. **Docs** — roadmap (008 en curso → Hecho), `CAMBIOS.md`, `CONVENCIONES.md` (sección auth), `.env.example` (`AUTH_SECRET`), tachar `spec.md`/`tasks.md`. CI: el job de e2e no cambia (ya corre con envs).

## Decisiones

- **Auth.js v5 + Credentials + JWT** — el tech-stack lo manda; Credentials es lo que pide el roadmap (email+password).
- **bcryptjs en lugar de bcrypt/argon2** — puro JS, sin compilar binarios (el entorno bloquea install scripts); el hash se verifica en runtime Node (server actions), no en edge.
- **Guard en layout/actions, no middleware** — consistente con el panel admin; menos superficie de edge runtime.
- **`Order.userId` requerido ya** — la BD está limpia (0 órdenes); hacerlo obligatorio desde ahora evita backfill futuro y cumple el roadmap ("obligatorio en V1").
- **OAuth, reset por email y cambio de contraseña fuera** — decisiones de scope para confirmar con el usuario (recomendado diferir).

## Riesgos

- **Versión de `next-auth`/Auth.js v5** — verificar compatibilidad con Next 15.5/React 19 al instalar (API de `signIn`/`signOut`/`auth()` estables en v5). Si hubiera problema, fijar la versión que soporte el stack y documentarlo.
- **Migración a `Order.userId` requerido** — seguro solo por BD limpia; si aparecieran órdenes huérfanas antes de migrar, usar `userId` opcional con backfill o constraint parcial.
- **Sesión JWT vs DB** — sin adapter, no hay sesiones revocables por DB; aceptable para esta etapa (hardening en 013).
- **E2E existentes que crean órdenes anónimas** — reescribir `storefront.spec.ts` y el helper de admin al flujo logueado; el `afterAll` debe limpiar también el usuario de prueba.
- **`AUTH_SECRET` en producción** — genera sesiones nuevas al rotarlo; definir y guardar en Vercel.
