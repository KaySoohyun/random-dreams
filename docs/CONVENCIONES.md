# Convenciones de Desarrollo

> Proyecto: Random Dreams — generación IA de contenido personalizado
> Stack: Next.js 15 (App Router) + React 19 + TypeScript + Prisma + PostgreSQL + Tailwind CSS + Gemini + Hugging Face + Inngest

## Lenguaje y estilo

- Todo el código, comentarios y documentación en **español**.
- **TypeScript estricto**: sin `any`, `@ts-ignore` o `ts-expect-error` salvo justificación explícita.
- Formato con **Prettier** (comillas simples, sin punto y coma, trailing commas). Lint con ESLint + TypeScript ESLint.
- No agregar comentarios salvo que aporten contexto no evidente (evitar comentarios descriptivos redundantes).

## Nombrado

- Componentes React: **PascalCase** (`ProductCard`, `DynamicForm`).
- Archivos de componentes: **kebab-case** (`product-card.tsx`) o carpeta con `index.tsx`.
- Funciones, variables y servicios: **camelCase** (`composePrompt`, `createOrder`).
- Constantes, enums y tipos: **PascalCase** (`PaymentStatus`, `AiResponseStatus`).
- Modelos de Prisma: **PascalCase** singular (`User`, `GeneratedResult`); columnas y campos de relación en **camelCase** (`passwordHash`, `aiPromptTemplate`, `productId`).
- Enums de Prisma: **PascalCase** con valores en inglés de modelo (`PaymentStatus` → `pending`/`approved`/`rejected`; `AiResponseStatus` → `queued`/`processing`/`completed`/`error`).
- Rutas y slugs: **kebab-case** (`/producto/[slug]`, `/cuenta/historial`, `/generacion/[orderId]`).
- Variables de entorno: prefijo `NEXT_PUBLIC_` solo para lo que viaja al cliente (ej. clave pública de Supabase); el resto privado (claves Gemini/HF). Todas documentadas en `.env.example`.

## Estructura y responsabilidades

- **Monolito Next.js** en un solo proyecto con carpetas `app/`, `components/`, `features/` (módulos por dominio: catalog, forms, orders), `lib/` (db, auth, servicios de dominio, `lib/ai` para proveedores de IA) y `inngest/` (funciones de background).
- **Regla de capas**: las rutas/Server Actions NO contienen lógica de negocio; delegan en `lib/services`. El dominio no debe importar de Next.js (`next/*`).
- **Server Components por defecto**: todo componente que no necesite interactividad debe ser Server Component. Marcar con `"use client"` solo cuando haya estado, eventos o hooks.
- **Server Actions** para mutaciones del dominio (crear orden, enviar formulario); **Route Handlers** solo para integraciones externas (webhook de Inngest, callbacks de auth) y para **servir archivos generados** (preview y descarga vía `/api/resultado/[orderId]`, con la lógica de qué devolver delegada en `lib/services`).
- **Nombres de archivo descargables**: `<slug-producto>-<valor-primer-campo-text>-<fecha>.ext` (slugify; fecha `YYYY-MM-DD` local al descargar; sin campo text, solo `<slug>-<fecha>`). Lo arma `buildResultFileName`/`getResultFileName` en `lib/services/generation.ts` leyendo `product.formSchema` + `formSubmission.formData`; extensión por formato (`txt`/`pdf`/`png`/`jpg`).
- **Rendering**: SSG/ISR para Home y catálogo; SSR para formulario, checkout, generación y resultado (dinámicos por orden).
- **Validación Zod** en todos los inputs (forms y handlers); los esquemas del formulario dinámico se derivan de `Product.formSchema` y se comparten entre cliente y servidor.

## Proveedores de IA

- Toda integración pasa por las interfaces **`AIContentProvider`** (Gemini) e **`AIImageProvider`** (Hugging Face) en `lib/ai/`. Nunca acoplar la lógica de generación a un proveedor concreto.
- Los **prompts** se componen en el pipeline (nunca interpolación cruda de usuario en el código); usar `Product.aiPromptTemplate` como base.
- **No exponer claves**: Gemini y Hugging Face solo en secrets de servidor; jamás en `NEXT_PUBLIC_*`.
- El payload enviado a la API de IA se registra en `GeneratedResult.aiRequestPayload` para trazabilidad.

## Pipeline Inngest

- Toda generación se orquesta en `inngest/` como función de background: `order/confirmed` → `composePrompt` → `generateImage` → `uploadResult` → `markCompleted`.
- Cada paso escribe en **`GenerationLog`** (`step`, `status`, `payload`, `error`) — obligatorio para trazabilidad y soporte.
- El pipeline debe ser **idempotente** por `orderId`; los reintentos reutilizan estado parcial.
- Estados de generación controlados por `GeneratedResult.aiResponseStatus`; el frontend hace polling (no webhooks push en MVP).
- Ante error persistente: marcar `error`, loguear y notificar al usuario; no reintentar en loop infinito.

## Checkout y pagos

- **Sin pasarela de pago** en esta etapa: el checkout es una confirmación simulada. `Order.paymentStatus` transiciona `pending → approved` y queda modelado para una integración futura.
- Si en V2 se integra una pasarela, debe hacerse detrás de una interfaz `PaymentGateway` sin tocar el dominio.
- Selección única por transacción (sin carrito acumulativo).

## Prisma

- Migraciones versionadas: crear con `npx prisma migrate dev`; aplicar en CI con `prisma migrate deploy`.
- Seeds demo obligatorios en `prisma/seed.ts`: los **6 productos** con sus `formSchema`, `aiTextTemplate` y `aiPromptTemplate`.
- `form_data` y `ai_request_payload` se guardan como **JSON** (columnas tipo `Json` de Prisma/PostgreSQL).
- Índices para campos de consulta frecuente: `Order.productId`, `Order.paymentStatus`, `Order.userId`, `GeneratedResult.orderId`.
- Operaciones multi-tabla en **transacciones** (ej. crear Order + FormSubmission).

## Panel admin (soporte)

- **Sin API REST**: el panel `/admin` usa exclusivamente **Server Actions** + Server Components (constitución). Los route handlers quedan solo para integraciones externas y servir archivos.
- Protegido por token `ADMIN_TOKEN` (`lib/admin/token.ts`, capa pura sin `next/*`): `verifyAdminToken` con `timingSafeEqual` sobre SHA-256. Tras el login se emite una **cookie de sesión firmada** (HMAC-SHA256 base64url, `httpOnly` + `sameSite: strict` + `path: /admin`, TTL 12 h, sin estado en BD).
- **Toda Server Action del panel re-verifica la sesión** antes de operar (guard en `app/admin/(panel)/layout.tsx` + verificación dentro de cada acción).
- El dominio del panel vive en `lib/services/admin.ts`; reintentar una orden reutiliza `retryGeneration` + `sendOrderConfirmed` (no duplica lógica).
- La cookie de sesión no es de usuario final: la **autenticación de usuarios** real (Auth.js) queda para V1.

## Storage (V1)

- Resultados generados se suben a **Supabase Storage** con URLs firmadas y con expiración para descargas.
- Nombrado: `usuario_id/orden_id/nombre-archivo.ext`.
- Respetar la política de retención/expiración de `StorageAsset.expiresAt`.

## CSS / UI

- Tailwind CSS con **design tokens** definidos en la configuración; no hardcodear colores/espaciados en los componentes.
- El design system vive en `components/` (Button, Input, Field, Card, StatusBadge, ResultViewer); los componentes de feature no reimplementan primitivas.
- Imágenes con `next/image` (dimensiones y optimización obligatorias).
- **Assets estáticos**: los archivos fuente viven en `assets/` y se copian a `public/` para servirse (logo → `public/assets/`, favicon → `public/favicon/`); no servir desde `assets/` directo. Favicon: reemplazar los íconos en `public/favicon/` + `site.webmanifest` y no volver a crear `app/favicon.ico` (Next le da prioridad sobre los metadata `icons`).

## Testing

- **Vitest** para unit/component tests de servicios (órdenes, formularios, contrato de IA) y componentes críticos.
- **Playwright** para E2E del flujo completo (`npm run test:e2e`): storefront (selección → formulario → confirmación → generación → descarga) y panel admin. Levanta **Next dev + Inngest Dev Server** (`inngest-cli dev`) automáticamente vía `webServer`; corre con **`AI_MOCK=true`** (sin llamadas reales) y `workers: 1`.
- Los helpers E2E (`e2e/helpers/db.ts`) usan **`pg` directo** (no el cliente Prisma generado: es ESM con `import.meta` y Playwright lo cargaría como CJS); los datos de prueba se crean y **limpian** en `beforeAll`/`afterAll`.
- Regla: todo cambio en dominio (órdenes, formularios, pipeline de generación) requiere test que lo cubra.
- El pipeline de IA se testea con **mocks de Gemini y Hugging Face** (no llamadas reales en CI). El smoke con proveedores **reales** se corre manualmente (o en CI con `AI_MOCK=false`).
- **CI**: `.github/workflows/ci.yml` (lint, unit, build, smoke, e2e) — en CI regenerar el cliente Prisma (`npx prisma generate`, `lib/generated/` está gitignoreado).

## Git

- Mensajes de commit en **español**, formato `tipo: descripción` (ej. `feat: agregar motor de formularios dinámico`, `fix: reintento de generación en timeout`).
- Tipos: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.
- No commitear secrets ni `.env`. Los `.env.example` documentan las variables requeridas.

## Seguridad

- Validación Zod en toda entrada; rate-limiting en confirmación de orden.
- Headers de seguridad (CSP) configurados en producción.
- Secrets (Gemini, Hugging Face, Supabase) en Vercel; nunca en el repo.
- URLs de descarga firmadas y con expiración; verificación de acceso en historial (V1).
- Manejo de datos personales del formulario según políticas de retención (GDPR, V2).

## Despliegue

- Cada PR genera un **preview** en Vercel; los cambios se fusionan solo con lint + tests + build en verde.
- Entornos: `preview` (PR) → `staging` (QA) → `production`.
- Migraciones de schema se aplican antes del deploy (CI/CD).
- Inngest cloud conectado por entorno; monitorear colas y reintentos en el Dashboard.
- Monitoreo con **Sentry** (errores) y alertas de tasa de generación fallida.
- Backups automáticos de la PostgreSQL gestionada (retención + snapshot diario).
