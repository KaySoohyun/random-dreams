# Random Dreams

Plataforma donde el usuario elige entre **6 productos**, completa un **formulario dinámico** configurable por producto, confirma el pedido y una **API de IA** genera un resultado (texto + imagen) descargable. La generación es **asíncrona** y se orquesta con **Trigger.dev** (con fallback inline si no está configurado), con estados de progreso visibles para el usuario.

No hay pasarela de pago en esta etapa: el checkout es una confirmación simulada que modela `payment_status` para una integración futura.

## Puesta en marcha en local

### Requisitos previos

- **Node.js 20+** y **npm** (package manager).
- **PostgreSQL** accesible (local, supabase o neon) con una base creada y las credenciales a mano. El plan se puede correr sin BD para el flujo del usuario, pero se necesita para el panel admin (`/admin`) y para persistir resultados si están configurados `DATABASE_URL`/`DIRECT_URL`.
- (Opcional) Claves de IA por si querés generación **real**: `GEMINI_API_KEY`/`GEMINI_MODEL` (texto) y `HF_TOKEN` (imagen). Si no las ponés, seteá `AI_MOCK=true` y todo funciona con proveedores simulados.

### Pasos

Todas las tareas se ejecutan desde la carpeta de la app:

```bash
cd app-random-dreams
npm install
```

Copiá la plantilla de entorno y completala con tus valores:

```bash
cp .env.example .env.local   # luego editalo (ver sección "Variables de entorno")
```

Ahora la base de datos (solo si querés BD):

```bash
npx prisma migrate dev       # aplica las migraciones del schema
npm run seed                 # carga el catálogo de productos en la BD
npx prisma generate          # regenera el cliente Prisma (obligatorio tras migrar)
```

Para desarrollo con IA simulada (sin claves reales), seteá en `.env.local`:

```
AI_MOCK=true
AI_IMAGE_OK=true             # opcional: fuerza la imagen placeholder en flujos felices
```

Para desarrollo con proveedores reales, completá `GEMINI_API_KEY`, `GEMINI_MODEL` (`gemini-flash-latest`) y `HF_TOKEN`.

Levantá la app:

```bash
npm run dev                  # http://localhost:3000
```

### Chequeo rápido

1. Abrí `http://localhost:3000` → deberías ver el Home con los 6 productos.
2. Entrá a una ficha (`/producto/[slug]`), completá el formulario, confirmá el pedido.
3. En `/generacion/[orderId]` el estado debería pasar a COMPLETED y poder descargar texto, imagen y PDF.
4. El panel `/admin` exige `ADMIN_TOKEN` en `.env.local` (login en `/admin/login`).

## Productos

Catálogo **data-driven**: los productos, sus formularios y plantillas de IA viven como datos (`formSchema`, `aiTextTemplate`, `aiPromptTemplate`). Agregar un producto no requiere cambios estructurales.

1. **Souvenirs de Sueños y Realidades Alternativas** — Crónica de tu vida en un universo paralelo + retrato.
2. **Criatura Fantástica** — Ficha de adopción de una criatura imposible + render ilustrado.
3. **Manual Absurdo** — Plan de evacuación ante invasiones absurdas + mapa esquemático.
4. **Identidad Secreta de Época** — Biografía histórica completa + souvenir visual con sellos oficiales.
5. **Receta Abstracta** — Fórmula alquímica de emociones + packaging listo para la estantería.
6. **Mascota Épica** — Leyenda heroica de tu mascota + ilustración estilo fantasía.

## Principales funcionalidades

- **Catálogo de 6 productos data-driven** — Listado y ficha de detalle; selección única por transacción (sin carrito).
- **Formulario dinámico por producto** — Motor configurable desde `Product.formSchema` (campos `text`, `number`, `select`, `multiselect`), validación Zod en frontend y backend.
- **Checkout sin pasarela** — Confirmación unitaria: `paymentStatus` `PENDING → APPROVED`; modelado para integración futura detrás de una interfaz `PaymentGateway`.
- **Generación IA asíncrona** — Pipeline `GENERATE_TEXT (Gemini) → UPLOAD_RESULT → GENERATE_IMAGE (Hugging Face) → MARK_COMPLETED`, con reintentos y trazabilidad en `GenerationLog`. Si la imagen falla, el pedido queda COMPLETED con el texto y la descarga de imagen se muestra "No disponible".
- **Entrega del resultado** — Página con polling de estado (queued/processing/completed/error), preview del texto + imagen, descarga directa (`.txt`, imagen y `.pdf` con logo de marca), reintento desde ERROR y nombres de archivo descriptivos `<slug>-<campo>-<fecha>.<ext>`.
- **Panel admin/soporte** — Protegido con token (`ADMIN_TOKEN`) y cookie de sesión firmada (HMAC-SHA256, TTL 12 h), sin API REST (solo Server Actions). Dashboard, listado/detalle de órdenes con `GenerationLog` y reintento desde `ERROR`.
- **Flujo sin base de datos (017)** — El flujo del usuario corre sin BD: catálogo estático en código (`lib/data/products.ts`), pedidos y resultados en memoria del servidor (Map con TTL), cookies firmadas para recuperar el pedido entre request/serverless instances y persistencia best-effort opcional a la BD al completar.

## Stack

| Capa | Tecnología |
|---|---|
| Framework / runtime | **Next.js 15** (App Router) + **React 19** + **TypeScript** estricto |
| Base de datos | **PostgreSQL** (Supabase/Neon) + **Prisma ORM** con migraciones versionadas |
| Estilos | **Tailwind CSS** con design tokens |
| IA — texto | **Google Gemini** (`@google/genai`) — `AIContentProvider` |
| IA — imagen | **Hugging Face Inference API** — `AIImageProvider` |
| Orquestación asíncrona | **Trigger.dev** (tasks, reintentos, timeouts) con fallback inline |
| PDF | `@react-pdf/renderer` + `react-markdown` |
| Validación | **Zod** |
| Tests | **Vitest** (unit/component) + **Playwright** (E2E) |
| Deploy / CI | **Vercel** + **GitHub Actions** |

## Arquitectura

Perímetro del flujo del usuario (sin BD):

```
Home → /catalogo → /producto/[slug] (formulario dinámico)
     → /checkout/[orderId] (confirmación simulada)
     → /generacion/[orderId] (polling + resultado + descargas)
     → /api/resultado/[orderId] (descarga de archivos)
```

El pipeline de generación (Trigger.dev / inline):

```
order/confirmed
  ├─ GENERATE_TEXT   → Gemini (texto + prompt de imagen)
  ├─ UPLOAD_RESULT   → guardar texto en el store
  ├─ GENERATE_IMAGE  → Hugging Face (fal-ai FLUX.1-schnell) → bytes
  └─ MARK_COMPLETED  → GeneratedResult COMPLETED + GenerationLog
```

Proveedores de IA aislados detrás de interfaces (`AIContentProvider`, `AIImageProvider`); nunca se acopla el dominio a un proveedor concreto. `AI_MOCK=true` usa proveedores simulados (dev/CI, sin claves reales).

**Regla de capas:** las rutas/Server Actions delegan en `lib/services`; el dominio no importa de `next/*`. Server Components por defecto; Server Actions para mutaciones; Route Handlers solo para integraciones externas y servir archivos.

## Base de datos: por qué y qué almacena

El flujo del usuario es **sin BD** (catálogo estático + órdenes en memoria con cookies firmadas) para eliminar latencia y depender solo de la app. La **PostgreSQL (Supabase/Neon) con Prisma** cubre lo que la memoria no puede:

- **Panel admin/soporte** — El admin lee de la BD: dashboard con conteos, listado de órdenes y `GenerationLog` por orden. Los pedidos del flujo sin BD **no** aparecen aquí salvo que se hayan persistido al completar.
- **Persistencia y recuperación** — Al completar la generación se hace un `upsert` best-effort de `Order` + `GeneratedResult` en la BD (si no está disponible la conexión, se ignora y memoria + cookie siguen sirviendo). Esto permite consultar resultados pasados desde el panel o rehidratar un pedido que ya no está en memoria.
- **Modelo de datos versionado** — El `schema.prisma` define la estructura y las migraciones se versionan y aplican en CI/deploy con `prisma migrate deploy`.

**Qué se almacena** (modelos en `prisma/schema.prisma`):

| Modelo | Contenido |
|---|---|
| `Product` | Los 6 productos: `formSchema` (formulario dinámico), `aiTextTemplate`/`aiPromptTemplate` (plantillas IA), activos y orden |
| `Order` | Órdenes: `productId`, `paymentStatus` (PENDING/APPROVED/REJECTED), `userId` (nullable, V1), fechas |
| `FormSubmission` | Respuestas del formulario por orden (`formData` JSON) |
| `GeneratedResult` | Resultado por orden: estado (`aiResponseStatus`), `textContent`, `imageBytes`, errores, `retryCount`, fechas; snapshot del payload IA en `aiRequestPayload` |
| `GenerationLog` | Trazabilidad del pipeline por paso (`step`, `status`, `payload`, `error`, `durationMs`) |

Relaciones: `Product 1:N Order`, `Order 1:1 FormSubmission`, `Order 1:1 GeneratedResult`, `Order 1:N GenerationLog`. Índices en `Order.productId`, `Order.paymentStatus`, `Order.createdAt`, `GeneratedResult.orderId`, `aiResponseStatus` y `GenerationLog(orderId, createdAt)`.

## Estructura del proyecto

**Raíz del repo** (documentación y specs):

```
random-dreams/
├── docs/             # ARQUITECTURA, CONVENCIONES, CAMBIOS, colores, componentes, productos
├── spec/             # Spec Driven Development
│   ├── constitution/ # mission, tech-stack, roadmap
│   └── features/     # NNN-nombre/ (spec.md, plan.md, tasks.md)
├── ia-tools/         # requerimientos y plan de ejecución
├── app-random-dreams/ # aplicación Next.js
└── .github/workflows/ # CI (lint, unit, build, smoke, e2e)
```

**Aplicación** (`app-random-dreams/`):

```
app/                    # rutas de Next.js (App Router)
├── (store)/            # storefront: home, catalogo, producto, checkout, generacion
├── admin/              # panel admin/soporte (login + panel con guard)
└── api/resultado/      # route handler de descarga de archivos generados
features/               # módulos por dominio (catalog, forms, checkout, result, admin)
components/ui/          # design system (navbar, footer, spinner, toast)
lib/
├── ai/                 # proveedores IA (gemini, huggingface, mock, factory, types)
├── data/products.ts    # catálogo estático de los 6 productos
├── services/           # lógica de negocio (orders, generation, products, admin)
├── store/              # órdenes en memoria + cookies firmadas
├── pdf/                # generación de PDF con logo
└── admin/              # token y sesión del panel admin
trigger/                # pipeline de generación y encolado
prisma/                 # schema.prisma, migraciones, seeds
e2e/                    # tests Playwright (storefront, admin, helpers con pg)
tests/unit/             # tests Vitest
scripts/                # smoke tests (pipeline, admin)
```

## Comandos

```bash
npm run dev          # servidor de desarrollo (Next dev + Turbopack)
npm run build        # build de producción (con lint + typecheck)
npm test             # tests unit/component (Vitest)
npm run test:e2e     # tests E2E (Playwright, levanta Next dev + IA mock)
npm run lint         # ESLint
npm run seed         # seed de la BD (productos)
# Prisma
npx prisma migrate dev      # crear y aplicar migración local
npx prisma migrate deploy   # aplicar migraciones (CI/deploy)
npx prisma generate         # regenerar el cliente Prisma (obligatorio tras migrar)
npx prisma studio           # explorar la BD
```

> **Prisma 7:** `migrate dev`/`deploy` **no regeneran** el cliente automáticamente (generador `prisma-client` con salida propia en `lib/generated/prisma`, gitignoreada). After migrar hay que correr `npx prisma generate`. El datasource se configura en `prisma.config.ts` (`DIRECT_URL` para CLI/migraciones) y el cliente exige driver adapter (`PrismaPg`).

## Variables de entorno

Documentadas en `app-random-dreams/.env.example`:

| Variable | Descripción |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | PostgreSQL (Supabase/Neon); `DIRECT_URL` sin pooler para Prisma CLI |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | IA de texto. Modelo que funciona en free tier: `gemini-flash-latest` |
| `HF_TOKEN` | IA de imagen (Hugging Face, provider fal-ai FLUX.1-schnell) |
| `AI_MOCK` | `true` usa proveedores simulados (dev/tests) |
| `AI_IMAGE_OK` | Con `AI_MOCK=true`, fuerza la imagen placeholder (flujos felices/tests) |
| `TRIGGER_API_URL`, `TRIGGER_SECRET_KEY`, `TRIGGER_PROJECT_ID`, `TRIGGER_ENVIRONMENT_ID` | Trigger.dev; si faltan, la generación corre inline |
| `ADMIN_TOKEN` | Token del panel `/admin` (se reemplaza por auth real en V1) |
| `ORDER_COOKIE_SECRET` | Firma de la cookie de recuperación de pedidos (flujo sin BD) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Storage en la nube (V1) |

Secrets de servidor (Gemini, Hugging Face, Supabase) solo en vars de Vercel, jamás en `NEXT_PUBLIC_*` ni en el repo.

## Testing

- **Unit/component (Vitest):** servicios de dominio (órdenes, generación, admin), formularios dinámicos, proveedores de IA con **mocks** (sin llamadas reales en CI), rutas y UI. ~140 tests.
- **E2E (Playwright):** flujo completo del storefront (selección → formulario → checkout → generación → descargas) + panel admin + 404s, con `AI_MOCK=true`, `AI_IMAGE_OK=true` y `workers: 1`. Los helpers usan `pg` directo (el cliente Prisma generado es ESM).
- **Smoke (Vitest):** pipeline de generación real/mock (`scripts/smoke-pipeline.test.ts`) y panel admin (`scripts/smoke-admin.test.ts`).
- **CI (GitHub Actions):** jobs de lint, unit, build, smoke (con y sin imagen) y e2e. Regenera el cliente Prisma (`npx prisma generate`) en cada job.

## Despliegue

- **Producción:** https://app-random-dreams.vercel.app (proyecto Vercel `kaysoohyuns-projects/app-random-dreams`).
- Flujo de entornos: `preview` (PR) → `staging` (QA) → `production`.
- Cada PR genera un preview; se fusiona solo con lint + tests + build en verde.
- Detalles en `docs/despliegue-mvp.md` y checklist de QA en `docs/qa-checklist-mvp.md`.

## Convenciones clave

- Código, comentarios y documentación en **español**; commits en español con formato `tipo: descripción` (`feat`, `fix`, `refactor`, `docs`, `test`, `chore`).
- **Fuente de verdad** para arquitectura: `docs/ARQUITECTURA.md`; para reglas: `docs/CONVENCIONES.md` y `spec/constitution/tech-stack.md`; colores/tipografía: `docs/colores.md` (paleta gold-night, no cambiar sin preguntar).
- Pipeline de generación **idempotente** por `orderId`; cada paso escribe `GenerationLog`; ante error persistente se marca `error` (sin reintentos infinitos).

## Estado del proyecto

MVP completo y en producción. Roadmap en `spec/constitution/roadmap.md`:

- **Hecho:** Fase 0 (descubrimiento y diseño), 001 Catálogo, 002 Formulario dinámico, 003 Checkout, 004 Pipeline IA, 005 Entrega de resultado, 006 Backend core (admin), 007 Testing y despliegue, 017 Flujo sin base de datos, 016 Post-producción (pulido UX).
- **V1 (backlog):** storage en la nube (Supabase), historial de generaciones, auth de usuarios (008 cancelada), testing y despliegue V1.
- **V2 (backlog):** optimización y escalabilidad, seguridad/cumplimiento (GDPR), analítica de producto, extensibilidad del catálogo + panel de gestión.

Historial detallado de cambios en `docs/CAMBIOS.md`.