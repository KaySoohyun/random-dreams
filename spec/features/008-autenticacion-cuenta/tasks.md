# 008 · Autenticación y cuenta — Tareas

- [ ] Dependencias `next-auth@^5` + `bcryptjs` (con OK del usuario) y `AUTH_SECRET` en `.env`, `.env.example` y Vercel prod.
- [ ] Schema: modelo `User` + `Order.userId` requerido + índice; migración + `prisma generate`.
- [ ] Auth.js v5: `auth.config.ts`, `auth.ts` (Credentials + bcrypt), `app/api/auth/[...nextauth]/route.ts`, `next-auth.d.ts`.
- [ ] `lib/services/users.ts`: `createUser`, `getUserByEmail`, `verifyCredentials`.
- [ ] `features/auth/actions.ts` + formularios: `registerUserAction`, `loginAction`, `logoutAction` (zod + `useActionState`).
- [ ] Rutas: `/login`, `/registro` (grupo `(auth)`), `/cuenta/layout` (guard) y `/cuenta/perfil`.
- [ ] Ordenes con dueño: `createPendingOrder`/`confirmOrder`/`getCheckoutOrder`/`getOrderGeneration`/`retryGeneration`/`getResultFile` con `userId`; `features/forms/actions.ts` exige sesión; `/api/resultado` con `auth()` + ownership.
- [ ] Tests unit: `users-service.test.ts`, `auth-actions.test.ts`; actualizar los existentes (orders/generation/admin) a firmas con `userId`.
- [ ] E2E: `e2e/auth.spec.ts` (registro, login ok/ko, logout, guard, ownership) y `e2e/storefront.spec.ts` al flujo logueado; helpers `createUser`/`cleanupUser`.
- [ ] Correr lint, unit, build, smoke y e2e en verde; BD limpia.
- [ ] Docs: roadmap (008 → Hecho), CAMBIOS, CONVENCIONES, `.env.example`, `[x]` en spec/tasks.
