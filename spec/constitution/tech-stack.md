# Tech stack y convenciones

Cómo está construido el proyecto y las reglas que todo el código debe respetar. Es la referencia técnica que ningún plan de feature debería contradecir. Basado en `docs/ARQUITECTURA.md` y `docs/CONVENCIONES.md`.

## Tecnologías

- **Lenguaje:** TypeScript estricto (sin `any`, `@ts-ignore` o `ts-expect-error` salvo justificación explícita).
- **Framework / runtime:** Next.js 15 (App Router) + React 19 sobre Node.
- **Base de datos:** PostgreSQL (Supabase/Neon) con Prisma ORM y migraciones versionadas.
- **Estilos:** Tailwind CSS con design tokens.
- **IA — texto:** Google Gemini (`@google/genai`) — `AIContentProvider`.
- **IA — imagen:** Hugging Face Inference API — `AIImageProvider`.
- **Orquestación asíncrona:** Inngest (background functions con pasos, reintentos y timeouts).
- **Autenticación (V1):** Auth.js (NextAuth), email + OAuth opcional.
- **Validación:** Zod (formularios dinámicos y entrada de usuario).
- **Tests:** Vitest (unit/component) + Playwright (E2E).
- **Despliegue:** Vercel (preview → staging → production) + Inngest cloud + CI/CD con GitHub Actions.
- **Monitoreo:** Sentry + Inngest Dashboard + Vercel Analytics.

## Archivos / módulos clave

- `app/(store)/` — storefront público: Home, catálogo, producto + formulario, checkout, generación, resultado.
- `app/(auth)/` — login/registro (V1).
- `app/cuenta/` — historial de generaciones y redescarga (V1).
- `app/admin/` — gestión de productos/formularios (V2).
- `app/api/inngest` — webhook de colas (Inngest).
- `features/` — módulos por dominio (catalog, forms, orders…).
- `lib/services` — lógica de negocio pura, sin dependencias de `next/*`.
- `lib/ai/` — proveedores de IA (`AIContentProvider`, `AIImageProvider`) + interfaces.
- `inngest/` — funciones de background: pipeline `composePrompt → generateImage → uploadResult → markCompleted`.
- `prisma/` — `schema.prisma`, migraciones y seeds (6 productos con `formSchema`, `aiTextTemplate` y `aiPromptTemplate`).
- `tests/` — e2e (Playwright).

## Comandos

- `npm run dev` — arranca el entorno local.
- `npm test` — ejecuta los tests (Vitest).
- `npx prisma migrate dev` — crea migración local del schema.
- `npx prisma migrate deploy` — aplica migraciones (CI/despliegue).
- `npm run build` — compila para producción (con lint + typecheck).

## Modelo de datos / dominio

- `Product.formSchema` — JSON que define el formulario dinámico del producto (campos, tipos, validaciones).
- `Product.aiTextTemplate` — plantilla del texto del producto (Gemini); nunca se interpola crudo.
- `Product.aiPromptTemplate` — plantilla de imagen para componer el prompt de IA; nunca se interpola crudo.
- `Order.paymentStatus` — `pending` / `approved` / `rejected`. Sin pasarela: la confirmación es simulada (`pending → approved`). `userId` nullable en MVP, obligatorio en V1.
- `FormSubmission.formData` — JSON con las respuestas del usuario por orden.
- `GeneratedResult.aiResponseStatus` — `queued` / `processing` / `completed` / `error`; el frontend hace polling.
- `GeneratedResult.aiRequestPayload` — snapshot del payload enviado a la IA (trazabilidad).
- `StorageAsset` — archivo persistido (V1); `expiresAt` según política de retención.
- `GenerationLog` — log por paso del pipeline (`step`, `status`, `payload`, `error`), obligatorio.
- Relaciones clave: `Product 1:N Order`, `Order 1:1 FormSubmission`, `Order 1:1 GeneratedResult`, `GeneratedResult 1:N StorageAsset`, `Order 1:N GenerationLog`.
- Índices: `Order.productId`, `Order.paymentStatus`, `Order.userId`, `GeneratedResult.orderId`.

## Convenciones

- Código, comentarios y documentación en **español**.
- Nombres: componentes **PascalCase** (`DynamicForm`); funciones/variables **camelCase** (`createOrder`); modelos de Prisma **PascalCase** singular, columnas en **camelCase**; enums **PascalCase** con valores en inglés de modelo; rutas y slugs **kebab-case**.
- Regla de capas: rutas/Server Actions no contienen lógica de negocio; delegan en `lib/services`. El dominio no importa de `next/*`.
- Server Components por defecto; `"use client"` solo cuando hay estado, eventos o hooks.
- Server Actions para mutaciones; Route Handlers solo para integraciones externas (webhook Inngest, callbacks de auth).
- Rendering: SSG/ISR para Home y catálogo; SSR para formulario, checkout, generación y resultado.
- Validación Zod en toda entrada; esquemas del formulario derivados de `formSchema` y compartidos cliente/servidor.
- Pipeline Inngest: idempotente por `orderId`, cada paso escribe `GenerationLog`, errores con reintentos con backoff (sin loop infinito), estado `error` persistente.
- Tests: cambio en dominio (órdenes, formularios, pipeline) requiere test; la IA se testea con mocks de Gemini/HF (no llamadas reales en CI).
- Commits en español, formato `tipo: descripción` (`feat`, `fix`, `refactor`, `docs`, `test`, `chore`).
- Prettier (comillas simples, sin punto y coma) + ESLint.

## Estilo visual

- Sistema de diseño base en `components/` (Button, Input, Field, Card, StatusBadge, ResultViewer); los features no reimplementan primitivas.
- Tokens/colores definidos en la configuración de Tailwind; no hardcodear colores ni espaciados.
- Imágenes con `next/image` (dimensiones y optimización obligatorias).
- Paleta y tipografías definitivas se fijan en la Fase 0 (diseño UX/UI).

## Límites duros

- No exponer claves: Gemini, Hugging Face y Supabase solo en secrets de servidor; jamás en `NEXT_PUBLIC_*`; no subir `.env*` al repo.
- No acoplar la lógica de generación a un proveedor de IA concreto (siempre por interfaz).
- No integrar IA de forma síncrona en el request: toda generación pasa por Inngest.
- No hacer llamadas reales a Gemini/HF en CI (usar mocks).
- No agregar dependencias sin avisar.
