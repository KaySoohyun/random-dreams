# 006 · Backend core (panel admin/soporte)

**Estado:** implementado ✅

## Qué hace

Área **`/admin`** de soporte, protegida por un **token compartido** (`ADMIN_TOKEN`, env) mientras no exista auth real (V1/008):

- **Login** `/admin/login`: formulario con el token; se valida en el servidor (comparación timing-safe) y se crea una **cookie de sesión firmada** (HMAC-SHA256, expiración ~12 h, `httpOnly`, `sameSite: strict`, `secure` en prod). Toda ruta `/admin/*` sin sesión válida redirige a login.
- **Dashboard** `/admin`: conteos (órdenes por estado, resultados por estado) y últimas 10 órdenes.
- **Órdenes** `/admin/ordenes`: listado con filtro por `paymentStatus` y búsqueda por id, paginado simple (10/página).
- **Detalle** `/admin/ordenes/[orderId]`: producto, respuestas del formulario con labels, estado de pago, `GeneratedResult` (estado, `retryCount`, fechas, `error`), `GenerationLog` ordenados (step/status/`durationMs`/`payload`/`error`/fecha), botón **"Reintentar generación"** (solo en `ERROR`) y link al resultado público.
- **Acciones** (`features/admin/actions.ts`, Server Actions que **re-verifican la sesión**): `adminLogin`, `adminLogout`, `adminRetryOrder` (reutiliza `retryGeneration` de 005 + `sendOrderConfirmed`).
- Nuevo env **`ADMIN_TOKEN`** documentado en `.env.example`; el área admin no es indexable (`robots`).

## Por qué

Materializa el módulo **1.6 · Backend core** (gestión de órdenes y logs de generación IA) de forma coherente con la constitución: Server Components/Server Actions para el dominio y sin API REST pública. Da a soporte una vista operativa de órdenes y trazabilidad `GenerationLog` (requerimiento 1.6). El token simple se reemplaza por auth real en 008 y el login admin por el área `(auth)`.

## Criterios de aceptación

- [ ] `/admin/*` sin sesión válida → `redirect` a `/admin/login`; con sesión válida → contenido.
- [ ] Login: token correcto crea la cookie de sesión (firmada, expira); token incorrecto → error visible en el formulario.
- [ ] Logout borra la cookie y redirige a `/admin/login`.
- [ ] Dashboard muestra conteos por estado y las últimas órdenes.
- [ ] `/admin/ordenes` filtra por `paymentStatus`, busca por id y pagina.
- [ ] Detalle muestra respuestas con labels, `GeneratedResult` y `GenerationLog` en orden descendente.
- [ ] "Reintentar generación" aparece solo en `ERROR`; reutiliza `retryGeneration` (`retryCount + 1`) y re-dispara `order/confirmed`; las acciones admin re-verifican la sesión.
- [ ] Comparación de token timing-safe; cookie `httpOnly`/`sameSite`; admin no indexable; `ADMIN_TOKEN` en `.env.example`.
- [ ] `npm run lint`, `npm test` y `npm run build` pasan.

## Fuera de alcance

- **Auth real** (registro/login, roles, recuperación) — feature **008**.
- **Rate-limiting del login**, CSP y auditoría de acceso — V2 (**013**).
- **CRUD de productos/formularios** (panel admin V2) — feature **015**.
- **API REST pública** de órdenes/logs — no contemplada por la constitución (el dominio se expone vía Server Components/Actions; route handlers solo para integraciones externas).
