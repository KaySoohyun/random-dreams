# 006 · Backend core (panel admin/soporte) — Tareas

_Checklist derivada de `plan.md`._

- [x] `.env.example`: `ADMIN_TOKEN`; valor local en `.env`.
- [x] `lib/admin/token.ts`: `verifyAdminToken` (timing-safe), `signSession`/`verifySession`, constantes.
- [x] `lib/admin/session.ts`: `getAdminSession()` (lee cookie con `next/headers`).
- [x] `lib/services/admin.ts`: `getAdminDashboard`, `listOrders`, `getOrderDetail`.
- [x] `features/admin/actions.ts`: `adminLoginAction`, `adminLogoutAction`, `adminRetryOrderAction` (todas con guard de sesión).
- [x] UI: `app/admin/layout.tsx` (guard + noindex + header), `/login`, `features/admin/login-form.tsx`, `features/admin/retry-order-form.tsx`.
- [x] `app/admin/page.tsx` (dashboard), `/ordenes` (filtros + paginación), `/ordenes/[orderId]` (detalle + logs + retry).
- [x] Tests: `admin-token.test.ts`, `admin-service.test.ts` y `admin-actions.test.ts` (login/logout/guard/retry).
- [x] Correr `npm run lint`, `npm test` y `npm run build`.
- [x] Smoke `scripts/smoke-admin.test.ts` (token real, ciclo sign/verify, consultas con BD limpia) + `include` en `scripts/vitest.smoke.config.ts`.
- [x] Mover 006 a "Hecho" en `../../constitution/roadmap.md` (descripción actualizada), entrada en `docs/CAMBIOS.md` y nota en `docs/ARQUITECTURA.md`/`docs/CONVENCIONES.md`.
