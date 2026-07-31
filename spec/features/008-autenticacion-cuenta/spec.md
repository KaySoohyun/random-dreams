# 008 · Autenticación y cuenta

**Estado:** **cancelada/diferida** por decisión del usuario (2026-07-31) — no se implementa auth por ahora; el MVP queda tal cual. Spec borrador conservado por si se retoma.

## Qué hace

Trae la cuenta de usuario a Random Dreams (primera feature de **V1**, roadmap):

1. **Registro y login con email + contraseña** — Auth.js (NextAuth v5) con proveedor *Credentials*, sesiones **JWT** (`AUTH_SECRET`). Contraseñas con hash (`bcryptjs`). Rutas `(auth)`: `/login` y `/registro`.
2. **Logout** — cierra la sesión y redirige.
3. **Perfil** — `/cuenta/perfil`: email + fecha de alta + botón de logout. `/cuenta` queda como sección protegida (el historial es 010).
4. **`Order.userId` obligatorio** — pedir requiere sesión: al crear la orden se graba `Order.userId`. Migración: nuevo modelo `User` + `Order.userId` requerido (la BD está limpia, 0 órdenes → sin backfill).
5. **Ownership (hardening del acceso por `orderId` del MVP)** — el acceso a `/checkout/[orderId]`, `/generacion/[orderId]`, `/api/resultado/[orderId]` (descargas) y al reintento se restringe al **dueño de la orden** (otro usuario o anónimo → 404). Cierra el compromiso anotado en 005/006.

## Por qué

El MVP dejó el acceso por `orderId` (cuid) sin autenticar como compromiso explícito. V1 agrega la cuenta: el usuario se identifica, sus órdenes quedan vinculadas (`Order.userId`) y el acceso a los resultados se protege. Es **prerrequisito** de 009 (storage por `usuario/orden`) y 010 (historial y redescarga).

## Criterios de aceptación

- [ ] Registrar un usuario nuevo: crea `User` con hash de contraseña, inicia sesión y redirige.
- [ ] Login con email/contraseña correctos → sesión iniciada; incorrectos → error visible (sin filtrar si el email existe).
- [ ] Logout → cierra sesión; `/cuenta/*` sin sesión → redirect a `/login` (con retorno a la URL de origen).
- [ ] Hacer un pedido sin sesión → redirect a `/login`; con sesión → `Order.userId` = id del usuario.
- [ ] Acceso a checkout/generación/descarga/reintento de una orden: solo su dueño (otro usuario o anónimo → 404).
- [ ] `Order.userId` requerido en el schema (migración); modelo `User` con `email` único e índice en `Order.userId`.
- [ ] `AUTH_SECRET` en `.env`/`.env.example` y en producción (Vercel); sesiones firmadas.
- [ ] Unit tests (servicio de usuarios, hashing/verify, actions de registro/login/logout con mocks) y E2E (auth: registro, login ok/ko, logout, guard, ownership; storefront reescrito al flujo logueado).
- [ ] `npm run lint`, `npm test`, `npm run build`, smoke y `npm run test:e2e` en verde.
- [ ] Docs actualizadas (roadmap, CAMBIOS, CONVENCIONES, `.env.example`).

## Fuera de alcance

- **OAuth (GitHub/Google)** — el roadmap lo marca "opcional"; por defecto se **difiere** (decisión del usuario).
- **Recuperación de contraseña por email** — requiere proveedor transaccional (Resend) y no hay credenciales; se **difiere** (queda como sub-feature cuando exista proveedor de emails).
- **Cambio de contraseña dentro de sesión** — posible ampliación, no incluido por defecto.
- **Historial y redescarga (010)** — `/cuenta` solo tiene perfil en esta feature.
- **Storage en la nube (009)**.
- **Auth del panel admin** — el token `ADMIN_TOKEN` se mantiene tal cual (roles/permisos de admin son 013).

## Cambios de comportamiento (a tener en cuenta)

- **Hacer un pedido ahora requiere iniciar sesión** (antes anónimo).
- **Las URLs de resultado ya no son públicas por `orderId`**: solo el dueño puede ver/descargar (el admin/soporte sigue accediendo por su panel).
- El E2E de storefront y el helper `createOrderForAdmin` deben adaptarse al flujo logueado.
