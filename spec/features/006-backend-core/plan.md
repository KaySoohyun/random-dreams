# 006 · Backend core (panel admin/soporte) — Plan

_Cómo se implementa lo descrito en `spec.md`. Respeta `constitution/` (Server Components/Actions para el dominio, sin route handlers de dominio ni auth en MVP) y `docs/CONVENCIONES.md` (regla de capas, `lib/services`, zod, tests)._

## Enfoque

- **Protección por capa de presentación, no middleware**: el guard vive en `app/admin/layout.tsx` y se re-verifica en cada Server Action (defensa en profundidad). Menos piezas y sin lógica en el borde.
- **Sesión stateless sin BD**: cookie firmada con HMAC (timestamp + firma). `ADMIN_TOKEN` es a la vez credencial y secret de firma → una sola variable, sin tablas ni otro secret.
- **Reutilizar dominio existente**: el detalle y el reintento reusan `retryGeneration` (005) y `OrderSummary`/`isFormSchema` (002/003); admin y storefront comparten el mismo camino de reintento.

## Implementación

1. **Env** — `.env.example`: `ADMIN_TOKEN` (con comentario). Local: agregar un valor en `.env` (gitignoreado).
2. **`lib/admin/token.ts`** (cripto pura, sin `next/*`, testeable):
   - `verifyAdminToken(input: string): boolean` — compara contra `process.env.ADMIN_TOKEN` normalizando con SHA-256 + `crypto.timingSafeEqual` (longitudes fijas).
   - `signSession(secret, ttlMs): string` y `verifySession(value, secret, nowMs): boolean` — valor `"<expiraMs>.<hmac>"`, HMAC-SHA256 de `"admin-session:<expiraMs>"`; rechaza expiradas o firmas inválidas.
   - Constantes `ADMIN_SESSION_NAME = "admin_session"` y `ADMIN_SESSION_TTL_MS` (12 h).
3. **`lib/admin/session.ts`** (infra, `server-only`) — `getAdminSession(): Promise<boolean>` lee `await cookies()` y valida con `verifySession`; `ADMIN_SESSION_SECRET` = `process.env.ADMIN_TOKEN`. _(Importa `next/headers`; es infraestructura, no dominio.)_
4. **`lib/services/admin.ts`** (dominio, `server-only`, Prisma):
   - `getAdminDashboard()` — `groupBy` de `Order.paymentStatus` y `GeneratedResult.aiResponseStatus` + 10 órdenes recientes (producto incluido).
   - `listOrders({ status?, q?, page })` — filtro por estado, búsqueda por id (`contains`, case-insensitive), 10/página, con `_count` para paginar.
   - `getOrderDetail(orderId)` — incluye `product`, `formSubmission`, `generatedResult`, `generationLogs` (desc por `createdAt`).
5. **`features/admin/actions.ts`** ("use server") — todas con guard `if (!(await getAdminSession())) redirect("/admin/login")`:
   - `adminLoginAction(prev, formData)` → valida token; ok → `cookies().set` (httpOnly, sameSite strict, secure prod, `maxAge` 12 h, path `/admin`) y `redirect("/admin")`; ko → `{ error }` (retorna para `useActionState`).
   - `adminLogoutAction()` → `cookies().delete` + `redirect("/admin/login")`.
   - `adminRetryOrderAction(orderId)` → `retryGeneration`; si retryó → `sendOrderConfirmed` (try/catch con `console.warn`) y `redirect` al detalle.
6. **UI**:
   - `app/admin/layout.tsx` — guard `getAdminSession()`; `metadata.robots = { index: false, follow: false }`; header simple (título "Admin · Random Dreams", link "Volver al sitio", form de logout).
   - `app/admin/login/page.tsx` — si ya hay sesión → `redirect("/admin")`; `LoginForm`.
   - `features/admin/login-form.tsx` — cliente, `useActionState(adminLoginAction)` + campo token (`type="password"`) + estado pendiente + error.
   - `features/admin/retry-order-form.tsx` — cliente, botón con `useFormStatus` (mismo patrón que `RetryForm` de 005).
   - `app/admin/page.tsx` — dashboard (conteos + lista reciente).
   - `app/admin/ordenes/page.tsx` — lee `searchParams` (`status`, `q`, `page`), lista con filtros y paginación (links a `/admin/ordenes?…`).
   - `app/admin/ordenes/[orderId]/page.tsx` — detalle; respuestas con labels vía `isFormSchema` + `OrderSummary`; tabla de `GenerationLog`; botón reintento solo si `ERROR`; link `/generacion/[orderId]`.
7. **Tests** — `tests/unit/admin-token.test.ts` (`verifyAdminToken` ok/ko; `signSession`/`verifySession` válida, expirada, firmada mal) y `tests/unit/admin-service.test.ts` (mock prisma: dashboard con `groupBy`, `listOrders` con filtros/paginación, `getOrderDetail` con includes).
8. **Validación** — lint + test + build. Smoke `scripts/smoke-admin.test.ts` (agregar a `include` de `scripts/vitest.smoke.config.ts`): `verifyAdminToken` contra el `ADMIN_TOKEN` real, ciclo sign/verify, y `listOrders` con BD vacía → sin datos; limpiar.
9. **Docs** — mover 006 a "Hecho" en `roadmap.md` (actualizar la descripción al alcance acordado), entrada en `docs/CAMBIOS.md`, nota en `docs/ARQUITECTURA.md`/`CONVENCIONES.md` (área admin token-gated; no API REST).

## Decisiones

- **Panel con token en vez de API REST** — decisión del usuario: la constitución no contempla route handlers de dominio; el soporte se sirve con Server Components/Actions. `ADMIN_TOKEN` queda como única credencial hasta 008.
- **Cookie firmada stateless, sin sesión en BD** — sin lib de auth en MVP; `ADMIN_TOKEN` firma la expiración. La misma variable funciona como secret porque su único uso es autorizar el panel.
- **Guard en layout + acciones** (no middleware) — la página entera está protegida y las mutaciones re-verifican; evita el salto de borde de middleware y una pieza más de infraestructura.
- **Reutilizar `OrderSummary`** para el detalle — es data-driven (productName + formSchema + formData) y evita duplicar el render de labels.
- **`timingSafeEqual` sobre SHA-256** — evita la dependencia de longitudes iguales de la comparación directa.

## Riesgos

- **`cookies()` async en Next 15** — `await cookies()` en el guard y en las acciones.
- **PII del `formData` expuesta en /admin** — mitigación MVP: token compartido + no indexar; rate-limiting y auditoría quedan anotados para 013.
- **El navbar público se muestra en /admin** (layout raíz global) — aceptable en MVP; si molesta, layout propio admin en V1.
- **`groupBy` con mock de prisma** — los tests unitarios cubren el contrato; el smoke con BD real valida la consulta.
