# Plan de Ejecución y Stack Técnico — Random Dreams

> Documento fuente de requerimientos: `ia-tools/requerimientos.md`
> Estado: borrador v1.0 — sujeto a revisión

---

## 1. Resumen ejecutivo

**Random Dreams** es una plataforma donde el usuario elige entre **6 productos** (generación de contenido personalizado), completa un **formulario dinámico** configurable por producto, confirma el pedido y una **API de IA** genera un resultado (texto + imagen) descargable. La generación es **asíncrona** y se orquesta con colas.

Se desarrolla como un **monolito full-stack con Next.js**, priorizando velocidad de desarrollo, simplicidad operativa y una única base de código. El proyecto se ejecuta en 4 fases alineadas a los requerimientos (Fase 0, MVP, V1, V2), con un entregable desplegable en cada una.

**Principios rectores:**
- Un solo proyecto Next.js (App Router) con capa de servicios desacoplada de las rutas.
- Proveedores externos (IA texto, IA imagen, storage) aislados detrás de interfaces para poder cambiarlos sin tocar el dominio.
- **Sin pasarela de pago**: en esta etapa el checkout es un flujo de confirmación simulada; `payment_status` se modela como dato para una integración futura.
- Cada fase termina con versión desplegable y tests pasando.

---

## 2. Stack tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Framework | **Next.js 15 (App Router)** + React 19 + TypeScript | Full-stack (SSR/SSG/ISR), API routes, un solo deploy |
| Estilos | **Tailwind CSS** + Design Tokens (CSS variables) | Velocidad y consistencia visual |
| ORM / DB | **Prisma ORM** + **PostgreSQL** | Tipado de extremo a extremo, migraciones versionadas |
| DB gestionada | Supabase / Neon (dev y prod inicial) | PostgreSQL serverless con backup incluido |
| IA — texto | **Google Gemini** (`@google/genai`) | Composición de prompts y texto estructurado |
| IA — imagen | **Hugging Face Inference API** (modelo a definir, ej. Stable Diffusion / FLUX) | Generación de imágenes vía token HF, sin infra propia |
| Orquestación async | **Inngest** | Background functions con pasos, reintentos, timeouts y colas; nativo para Next.js/Vercel |
| Storage (V1) | **Supabase Storage** (tier gratuito) | Subida automática del resultado generado |
| Autenticación (V1) | **Auth.js (NextAuth)** — email + OAuth opcional | Integración nativa con App Router |
| Validación | **Zod** | Esquemas de formulario dinámico y validación de entrada |
| Emails (opcional) | **Resend** + React Email | Confirmación de pedido y errores de generación |
| Testing | **Vitest** (unit/component) + **Playwright** (E2E) | Cobertura del flujo compra → generación → descarga |
| CI/CD | **GitHub Actions** → build, lint, test → deploy a Vercel | Despliegue automatizado |
| Deploy | **Vercel** + PostgreSQL gestionada + **Inngest cloud** | Escala automática, previews por PR, colas sin infra |
| Monitoreo | **Sentry** (errores) + Inngest Dashboard + Vercel Analytics | Visibilidad en prod y trazabilidad de generación |

**Nota sobre pagos:** sin pasarela en esta etapa. El flujo de "pago" del MVP es una confirmación del pedido que deja `payment_status` en el estado correspondiente; si en V2 se decide integrar una pasarela real, se aísla detrás de una interfaz `PaymentGateway` sin tocar el dominio.

**Estructura de carpetas (monorepo simple):**

```
ia-tools/
├── app/                    # rutas de Next.js (App Router)
│   ├── (store)/            # storefront público
│   │   ├── page.tsx        # Home / Landing
│   │   ├── catalogo/       # listado de 6 productos
│   │   ├── producto/       # detalle + formulario dinámico
│   │   ├── checkout/       # confirmación unitaria
│   │   ├── generacion/     # estado de generación (polling)
│   │   └── resultado/      # visualización + descarga
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

---

## 3. Arquitectura

### 3.1 Flujo end-to-end (user flow)

```
Selección → Formulario dinámico → Confirmación (checkout sin pasarela)
         → Orden creada → Evento Inngest → Generación IA → Resultado + descarga
```

1. **Catálogo**: listado de los 6 productos activos (`Product.active`).
2. **Detalle + Formulario**: el formulario se renderiza desde `Product.form_schema` (JSON). Validación con Zod en frontend y backend. La respuesta se persiste temporalmente (`FormSubmission` con `form_data`).
3. **Checkout**: selección única (sin carrito). Confirmación del pedido sin pasarela de pago: se crea la `Order` con `payment_status` (`pending` → `approved` en confirmación simulada).
4. **Generación**: al confirmar la orden, Inngest dispara el pipeline asíncrono y actualiza `GeneratedResult.ai_response_status` (`queued → processing → completed | error`). El frontend hace polling del estado.
5. **Resultado**: página de resultado con visualización y botón de descarga (V1: archivo persistido en Supabase Storage y accesible desde el historial).

### 3.2 Capa de dominio

- **Monolito Next.js**: Server Components para renderizado/SEO; Server Actions para mutaciones del dominio; Route Handlers solo para integraciones externas (webhook de Inngest, callbacks de auth).
- **Capa de servicios** (`lib/services`): lógica de negocio pura (órdenes, formularios, resultados), sin dependencias de `next/*`. Las rutas/actions las invocan. Facilita testeo y reemplazo de infraestructura.

### 3.3 Contrato de API de IA

El pipeline recibe `form_data` + `Product.ai_text_template` / `Product.ai_prompt_template` y produce un resultado. Se abstrae en dos interfaces:

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

- **Gemini** (`AIContentProvider`): compone/refina el prompt a partir de la plantilla del producto y los datos del formulario.
- **Hugging Face** (`AIImageProvider`): genera la imagen vía Inference API (token HF). Modelo a definir en Fase 0 (SD 1.5 / SDXL / FLUX según calidad, velocidad y costo).
- Los **inputs/outputs del contrato** se definen y versionan en la Fase 0 (`docs/contrato-ia.md`): inputs = `{ productId, form_data, ai_text_template, ai_prompt_template }`; outputs = `{ file, file_format, metadata }`.

### 3.4 Pipeline de generación con Inngest

```
Evento: order/confirmed
  │
  ├─ Paso 1 · composePrompt   → Gemini (AIContentProvider)
  ├─ Paso 2 · generateImage   → Hugging Face (AIImageProvider)
  ├─ Paso 3 · uploadResult    → Supabase Storage (V1) / ruta pública (MVP)
  └─ Paso 4 · markCompleted   → GeneratedResult + GenerationLog
```

- **Reintentos y timeouts**: Inngest reintenta con backoff ante fallos transitorios (rate limit HF, timeout de red). Si el paso de generación supera el timeout, se marca `error` y se loguea para soporte.
- **Trazabilidad**: cada paso escribe en `GenerationLog` (`step`, `status`, `payload`, `error`, timestamps) para soporte y depuración.
- **Idempotencia**: el pipeline responde al mismo `orderId` una sola vez; reintentos reutilizan estado parcial.

### 3.5 Rendimiento y SEO

- ISR para Home y catálogo; ficha de producto estática con ISR.
- El formulario y el checkout se sirven con SSR; el estado de generación usa polling ligero (no WebSocket en MVP).

---

## 4. Modelo de datos (mapeo a Prisma)

Todas las entidades de `requerimientos.md` se implementan en `prisma/schema.prisma`:

| Entidad | Campos clave | Notas |
|---|---|---|
| `User` | email, passwordHash / authProvider, createdAt | V1; email único |
| `Product` | name, description, formSchema (JSON), aiTextTemplate, aiPromptTemplate, active | catálogo de 6 productos |
| `Order` | userId (nullable MVP), productId FK, paymentStatus (`pending`/`approved`/`rejected`), createdAt | sin pasarela: confirmación simulada |
| `FormSubmission` | orderId FK, formData (JSON), submittedAt | respuesta del formulario por orden |
| `GeneratedResult` | orderId FK, aiRequestPayload, aiResponseStatus (`queued`/`processing`/`completed`/`error`), resultFileUrl, fileFormat, generatedAt | resultado de la generación |
| `StorageAsset` | generatedResultId FK, storageProvider, storagePath, expiresAt (opcional) | V1; política de retención |
| `GenerationLog` | orderId, step, status, payload, error, timestamps | logs de trazabilidad (requerimientos 1.6) |

**Relaciones clave:** `Product 1:N Order`, `Order 1:1 FormSubmission`, `Order 1:1 GeneratedResult`, `GeneratedResult 1:N StorageAsset`, `Order 1:N GenerationLog`.

Índices: `Order.productId`, `Order.paymentStatus`, `Order.userId` (V1), `GeneratedResult.orderId`.

---

## 5. Plan de ejecución por fases

Cada fase termina con una versión desplegable en staging. Duraciones estimadas en semanas de desarrollo de un equipo chico (1–2 devs full-stack).

### Fase 0 — Descubrimiento y Diseño (≈2 semanas)

**Módulo 0.1 — Definición de Producto**
- Documento de alcance funcional (MVP / V1 / V2) confirmado con stakeholders.
- Definición de los **6 productos**: nombre, propuesta de valor, `form_schema` (campos, tipos, validaciones) y las plantillas `ai_text_template` + `ai_prompt_template`.
- User flow end-to-end documentado: selección → formulario → confirmación → generación → entrega.

**Módulo 0.2 — Arquitectura Técnica**
- Diagrama de arquitectura (frontend, backend, API de IA, storage, orquestación Inngest).
- Contrato de API de IA: inputs/outputs de Gemini y Hugging Face, modelos elegidos, límites y costos.
- Selección de almacenamiento cloud: **Supabase Storage** (tier gratuito) para V1.

**Módulo 0.3 — Diseño UX/UI**
- Wireframes: listado, detalle/formulario, checkout, estado de generación, resultado.
- Prototipo navegable (baja/alta fidelidad).
- Sistema de diseño base: tokens, tipografía, componentes UI (Button, Input, Field, Card, StatusBadge, ResultViewer).

**Módulo 0.4 — Modelado de Datos**
- Diagrama ERD preliminar (entidades de la sección 4).
- Definición del esquema Prisma + migración inicial + seeds demo (6 productos con sus `form_schema` y templates).

**Entregable:** repo desplegado en Vercel con schema en DB y prototipo de las 5 pantallas clave.

### Fase 1 — MVP (≈5–6 semanas)

| Módulo | Alcance |
|---|---|
| 1.1 Frontend: catálogo y selección | Listado de 6 productos, página de detalle, selección única (sin carrito acumulativo) |
| 1.2 Formulario dinámico | Motor de formularios configurable por `form_schema`; validaciones Zod frontend + backend; persistencia temporal de la respuesta |
| 1.3 Checkout y pago | Flujo de confirmación unitario (sin pasarela); manejo de estados `pending`/`approved`/`rejected` como dato |
| 1.4 Integración con API de IA | Servicio de orquestación (form data → payload IA); pipeline Inngest tras confirmación; estados de generación; reintentos y timeouts |
| 1.5 Entrega de resultado | Página de resultado generado; botón de descarga directa; manejo de formatos de salida |
| 1.6 Backend core | API REST/GraphQL de soporte; gestión de órdenes; logs de generación IA (`GenerationLog`) |
| 1.7 Testing y despliegue MVP | Pruebas funcionales del flujo completo (confirmación → generación → descarga); integración con IA (Gemini/HF); deploy en producción; checklist QA pre-lanzamiento |

**Criterios de salida:** un usuario puede elegir producto → completar formulario → confirmar → ver estado de generación → descargar el resultado. Los 6 productos generan correctamente. Los errores de IA se reintentan y, si persisten, quedan logueados con estado `error`.

### Fase 2 — V1 (≈3–4 semanas)

**Módulo 2.1 — Autenticación y cuenta**
- Registro / login (email + OAuth opcional), recuperación de contraseña, perfil básico.
- `Order.userId` pasa a ser obligatorio para usuarios autenticados.

**Módulo 2.2 — Almacenamiento en la nube**
- Integración con **Supabase Storage** (tier gratuito).
- Subida automática del resultado generado tras cada compra.
- Política de nombrado: `usuario_id/orden_id/nombre-archivo.ext`; organización por usuario/orden.

**Módulo 2.3 — Panel de usuario / historial**
- Vista de historial de generaciones del usuario autenticado.
- Redescarga de resultados previos (con verificación de acceso).

**Módulo 2.4 — Testing y despliegue V1**
- Pruebas de integración: auth + storage + historial; regresión sobre flujo MVP.
- Despliegue incremental (feature flag opcional para auth).

### Fase 3 — V2 (≈4–5 semanas)

**Módulo 3.1 — Optimización y escalabilidad**
- Revisión de performance del llamado a IA (caché de prompts, colas asíncronas, concurrencia).
- Optimización de almacenamiento: limpieza/expiración de archivos no reclamados (`StorageAsset.expiresAt`).
- Monitoreo y alertas: uptime, tasa de errores de generación, latencia del pipeline.

**Módulo 3.2 — Seguridad y cumplimiento**
- Hardening de autenticación (roles y permisos).
- Revisión del manejo de datos personales en formularios.
- Políticas de retención de archivos generados (GDPR: derecho al olvido, expiración).

**Módulo 3.3 — Analítica de producto**
- Instrumentación de eventos: selección, formulario, confirmación, generación, descarga.
- Dashboard de métricas de uso y conversión (funel completo).

**Módulo 3.4 — Extensibilidad de catálogo**
- Arquitectura para incorporar nuevos productos sin cambios estructurales (catálogo 100% data-driven por `form_schema` + `ai_text_template` + `ai_prompt_template`).
- Panel administrativo básico: gestión de productos y formularios.

---

## 6. Infraestructura y despliegue

- **Entornos**: `preview` (por PR, automático en Vercel) → `staging` (demo/QA) → `production`.
- **Bases de datos**: una PostgreSQL por entorno; migraciones aplicadas en CI (`prisma migrate deploy`).
- **Secrets**: claves de Gemini y Hugging Face, credenciales de storage en Vercel; nunca en el repo. Documentadas en `.env.example`.
- **Colas**: Inngest cloud conectado al entorno correspondiente; webhook expuesto en `api/inngest`.
- **Almacenamiento**: Supabase Storage con bucket privado en prod; firmas/URLs temporales para descargas.
- **Monitoreo**: Sentry (frontend y backend), Inngest Dashboard (estado de colas y reintentos), alertas de tasa de generación fallida.
- **Backups**: retención automática de la PostgreSQL gestionada + snapshot diario.
- **Seguridad**: validación Zod en toda entrada, rate-limiting en confirmación de orden, headers de seguridad (CSP), URLs de descarga firmadas y con expiración.

---

## 7. Riesgos y decisiones pendientes

| Decisión pendiente | Impacto | Recomendación |
|---|---|---|
| Confirmación de pedido sin pasarela de pago | El MVP no cobra; validar el modelo de negocio | Confirmar con stakeholders cómo se "confirma" el pedido en MVP (mock); modelar `payment_status` para integración futura |
| Modelo de imagen en Hugging Face | Calidad, velocidad y costo de la generación | Probar 2–3 modelos (SD 1.5 / SDXL / FLUX) en Fase 0 y fijar el definitivo |
| Rate limits del tier gratuito de HF y Supabase | Fallos por cuota en generaciones o subidas | Diseñar para reintentos; definir plan de pago si el volumen lo exige |
| Costo y límites de Gemini (composición de prompts) | Costo operativo por generación | Cachear prompts compuestos; monitorear uso en staging |
| Tiempo máximo de generación | UX y diseño de reintentos | Definir timeout (ej. 90–120s) y mensajes de estado claros |
| Retención/expiración de archivos generados | Legal (GDPR) y costos de storage | Definir política en V1: `StorageAsset.expiresAt` + limpieza programada (V2) |
| Formato de salida soportado | Alcance del producto 1.5 | Fijar en Fase 0 según los 6 productos (PNG/JPG para imagen, texto para Gemini) |

---

## 8. Checkpoints de revisión

- **End de Fase 0**: revisar los 6 productos, `form_schema`, contrato de IA y diseño con stakeholders.
- **End de MVP**: demo del flujo completo (selección → formulario → confirmación → generación → descarga) y revisión de calidad de los resultados IA.
- **End de V1**: revisión de métricas de uso (conversión del flujo, errores de generación) para priorizar V2.
- **End de V2**: decidir si se integra pasarela de pago real y si el catálogo crece vía panel admin.
