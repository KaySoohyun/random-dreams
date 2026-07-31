# Arquitectura — Random Dreams

> Fuente: `ia-tools/requerimientos.md` y `ia-tools/plan-ejecucion.md`

## Propósito

Plataforma donde el usuario elige entre **6 productos**, completa un **formulario dinámico** configurable por producto, confirma el pedido y una **API de IA** genera un resultado (texto + imagen) descargable. La generación es **asíncrona** y se orquesta con **Inngest**. No hay pasarela de pago en esta etapa: el checkout es una confirmación simulada que modela `payment_status` para una integración futura.

## Estructura del proyecto

```
ia-tools/
├── app/                    # rutas de Next.js (App Router)
│   ├── (store)/            # storefront público
│   │   ├── page.tsx        # Home / Landing
│   │   ├── catalogo/       # listado de 6 productos
│   │   ├── producto/       # detalle + formulario dinámico
│   │   ├── checkout/       # confirmación unitaria
│   │   ├── generacion/     # estado de generación (polling) + resultado
│   ├── (auth)/             # login/registro (V1)
│   ├── cuenta/             # historial / redescarga (V1)
│   ├── admin/              # gestión de productos/formularios (V2)
│   └── api/                # route handlers (webhook Inngest, storage)
├── components/             # UI (design system) y features
├── features/               # módulos por dominio (catalog, forms, orders…)
├── lib/                    # db, auth, servicios de dominio
│   └── ai/                 # proveedores de IA (texto e imagen) + interfaces
├── prisma/                 # schema.prisma + migraciones + seeds
├── inngest/                # funciones de background (pipeline de generación)
├── public/                 # estáticos
└── tests/                  # e2e (Playwright)
```

## Flujo de datos

1. El **storefront** usa Server Components (SSR/SSG/ISR) para renderizado y SEO: Home, catálogo y ficha de producto.
2. El **formulario dinámico** se renderiza desde `Product.form_schema` (JSON). Se valida con **Zod** en frontend y backend; la respuesta se persiste en `FormSubmission` (`form_data`).
3. El **checkout** es una confirmación unitaria sin pasarela: se crea la `Order` y se actualiza `payment_status` (`pending` → `approved` en confirmación simulada).
4. Al confirmar la orden, **Inngest** dispara el pipeline asíncrono y actualiza `GeneratedResult.ai_response_status` (`queued → processing → completed | error`). El frontend hace **polling** del estado.
5. Cada paso del pipeline escribe en **`GenerationLog`** para trazabilidad y soporte.
6. El resultado se muestra en `/generacion/[orderId]` (texto + preview de imagen) y los archivos se sirven por el route handler **`/api/resultado/[orderId]`** (descarga directa nativa). En V1 se persiste en Supabase Storage y queda disponible en el historial.
7. El **panel admin/soporte** vive en `/admin`, protegido con token (`ADMIN_TOKEN`): tras el login se emite una **cookie de sesión firmada** (HMAC-SHA256, sin estado en BD, TTL 12 h) con path `/admin`; todas las Server Actions del panel re-verifican la sesión. Muestra dashboard (conteos), listado/detalle de órdenes con `GenerationLog` y permite reintentar desde `ERROR`. Sin API REST (constitución: Server Actions para dominio).

## Pipeline de generación (Inngest)

```
Evento: order/confirmed
  │
  ├─ Paso 1 · composePrompt   → Gemini (AIContentProvider)
  ├─ Paso 2 · generateImage   → Hugging Face (AIImageProvider)
  ├─ Paso 3 · uploadResult    → Supabase Storage (V1) / ruta pública (MVP)
  └─ Paso 4 · markCompleted   → GeneratedResult + GenerationLog
```

- **Reintentos y timeouts**: Inngest reintenta con backoff ante fallos transitorios (rate limit HF, timeout de red). Si la generación supera el timeout, se marca `error` y se loguea.
- **Idempotencia**: el pipeline responde al mismo `orderId` una sola vez; los reintentos reutilizan estado parcial.

## Contrato de API de IA

```typescript
interface AIContentProvider {
  // Gemini: arma el prompt final y genera texto estructurado/detalle
  composePrompt(input: { template: string; formData: Record<string, unknown> }): Promise<string>;
}

interface AIImageProvider {
  // Hugging Face: genera la imagen a partir del prompt
  generateImage(input: { prompt: string; format: string }): Promise<Buffer>;
}
```

Los inputs/outputs del contrato se versionan en la Fase 0: inputs = `{ productId, form_data, ai_text_template, ai_prompt_template }`; outputs = `{ file, file_format, metadata }`.

## Routing

| Ruta | Descripción | Render |
|---|---|---|
| `/` | Home / Landing | SSG/ISR |
| `/catalogo` | Listado de los 6 productos | SSG/ISR |
| `/producto/[slug]` | Detalle + formulario dinámico | SSG/ISR (form con SSR) |
| `/checkout/[orderId]` | Confirmación unitaria (sin pasarela) | SSR |
| `/generacion/[orderId]` | Estado de generación (polling) + resultado con descarga | SSR |
| `/api/resultado/[orderId]` | Sirve los archivos generados (`.txt`, imagen) | API |
| `/admin/login` | Login del panel con `ADMIN_TOKEN` | SSR + Server Action |
| `/admin` | Dashboard del panel (conteos y resumen) | SSR + guard |
| `/admin/ordenes` | Listado de órdenes (filtros + paginación) | SSR + guard |
| `/admin/ordenes/[orderId]` | Detalle de orden con `GenerationLog` + retry | SSR + guard |
| `/login`, `/registro` | Autenticación | V1 |
| `/cuenta/historial` | Historial de generaciones y redescarga | V1, SSR (auth) |
| `/admin/*` (gestión de productos/formularios) | Gestión de catálogo | V2 |
| `/api/inngest` | Webhook de colas (Inngest) | API |

## Modelo de datos (Prisma / PostgreSQL)

### User (V1)

```typescript
interface User {
  id: string;
  email: string;              // único
  passwordHash?: string;      // o authProvider (OAuth)
  authProvider?: string;
  createdAt: Date;
}
```

### Product

```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  formSchema: JSON;           // definición de campos del formulario dinámico
  aiTextTemplate: string;     // plantilla del texto del producto (Gemini)
  aiPromptTemplate: string;   // plantilla de imagen (Hugging Face)
  active: boolean;
}
```

### Order

```typescript
type PaymentStatus = 'pending' | 'approved' | 'rejected';

interface Order {
  id: string;
  userId?: string;            // nullable en MVP, obligatorio en V1
  productId: string;          // FK
  paymentStatus: PaymentStatus;  // sin pasarela: confirmación simulada
  createdAt: Date;
}
```

### FormSubmission

```typescript
interface FormSubmission {
  id: string;
  orderId: string;            // FK
  formData: JSON;             // respuestas del usuario
  submittedAt: Date;
}
```

### GeneratedResult

```typescript
type AiResponseStatus = 'queued' | 'processing' | 'completed' | 'error';

interface GeneratedResult {
  id: string;
  orderId: string;            // FK
  aiRequestPayload: JSON;
  aiResponseStatus: AiResponseStatus;
  resultFileUrl?: string;
  fileFormat?: string;
  generatedAt?: Date;
}
```

### StorageAsset (V1)

```typescript
interface StorageAsset {
  id: string;
  generatedResultId: string;  // FK
  storageProvider: string;    // supabase / firebase / cloudinary
  storagePath: string;
  expiresAt?: Date;           // política de retención
}
```

### GenerationLog

```typescript
interface GenerationLog {
  id: string;
  orderId: string;            // FK
  step: string;               // composePrompt | generateImage | uploadResult | markCompleted
  status: string;
  payload?: JSON;
  error?: string;
  createdAt: Date;
}
```

### Relaciones principales

- `Product 1:N Order`
- `Order 1:1 FormSubmission`, `Order 1:1 GeneratedResult`
- `GeneratedResult 1:N StorageAsset`
- `Order 1:N GenerationLog`

Índices: `Order.productId`, `Order.paymentStatus`, `Order.userId` (V1), `GeneratedResult.orderId`.

## Dependencias principales

- **Next.js 15** (App Router) + **React 19** — Framework full-stack
- **TypeScript** — Tipado estricto
- **Tailwind CSS** — Utility-first CSS con design tokens
- **Prisma ORM** + **PostgreSQL** (Supabase/Neon) — Datos con migraciones versionadas
- **Google Gemini** (`@google/genai`) — Composición de prompts y texto (AIContentProvider)
- **Hugging Face Inference API** — Generación de imágenes (AIImageProvider)
- **Inngest** — Orquestación asíncrona con reintentos y timeouts
- **Auth.js (NextAuth)** — Autenticación email + OAuth opcional (V1)
- **Zod** — Validación de formularios dinámicos y entradas
- **Resend** + **React Email** — Emails transaccionales (opcional)
- **Vitest** — Tests unit/component
- **Playwright** — Tests E2E
- **GitHub Actions** + **Vercel** — CI/CD y deploy
- **Sentry** + Inngest Dashboard — Monitoreo

## Layout

```
┌──────────┬────────────────────────────────────────────┐
│          │  Header (logo, catálogo, cuenta, historial)│
│  Nav     ├────────────────────────────────────────────┤
│  global  │  Home: hero + 6 productos destacados       │
│          ├────────────────────────────────────────────┤
│          │  Detalle: formulario dinámico por producto  │
│          ├────────────────────────────────────────────┤
│          │  Resultado: visualización + descarga       │
└──────────┴────────────────────────────────────────────┘
```

**Jerarquía visual:**
1. **Home / Landing** — Presentación y los 6 productos
2. **Detalle + Formulario** — Captura de inputs personalizados para la generación
3. **Checkout** — Confirmación unitaria del pedido
4. **Estado de generación** — Progreso del pipeline de IA (polling)
5. **Resultado** — Visualización y descarga del archivo generado
