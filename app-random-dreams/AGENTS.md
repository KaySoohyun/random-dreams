# AGENTS.md — Random Dreams

Plataforma donde el usuario elige entre **6 productos**, completa un **formulario dinámico** configurable por producto, confirma el pedido y una **API de IA** genera un resultado (texto + imagen) descargable. La generación es **asíncrona** (Trigger.dev; con fallback inline si no está configurado). No hay pasarela de pago: el checkout es una confirmación simulada.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (full-stack)
- **Prisma ORM** + **PostgreSQL** (Supabase / Neon)
- **Tailwind CSS** + design tokens
- **Google Gemini** (`@google/genai`) — texto / prompts (AIContentProvider)
- **Hugging Face Inference API** — imágenes (AIImageProvider)
- **Trigger.dev** — orquestación asíncrona (tasks, reintentos, timeouts); fallback inline si no hay credenciales
- **Auth.js (NextAuth)** — V1 (email + OAuth opcional)
- **Zod** — validación de formularios dinámicos
- **Vitest** + **Playwright** — tests
- **npm** como package manager
- **Vercel** + **GitHub Actions** — deploy y CI/CD

## Comandos

```bash
npm run dev        # servidor de desarrollo
npm test           # tests (Vitest)
npm run build      # build de producción (lint + typecheck)
npx prisma migrate dev     # crear migración local y aplicarla
npx prisma migrate deploy  # aplicar migraciones (CI/deploy)
npx prisma generate        # regenerar el cliente Prisma (obligatorio tras migrar)
npx prisma studio          # explorar la BD
```

> **Prisma 7:** `prisma migrate dev`/`deploy` **no regeneran el cliente** automáticamente (generador `prisma-client` con `output` propio). Después de cualquier migración hay que correr `npx prisma generate`. Recordar además: el datasource se configura en `prisma.config.ts` (usa `DIRECT_URL` para CLI/migraciones), y el cliente exige driver adapter (`PrismaPg`) — el tipo del modelo es `ProductModel`.

## Estructura del proyecto

```
app-random-dreams/
├── app/                    # rutas de Next.js (App Router)
│   ├── (store)/            # storefront: home, catalogo, producto, checkout, generacion, resultado
│   ├── (auth)/             # login/registro (V1)
│   ├── cuenta/             # historial / redescarga (V1)
│   ├── admin/              # gestión de productos/formularios (V2)
│   └── api/                # route handlers (storage)
├── components/             # UI (design system) y features
├── features/               # módulos por dominio (catalog, forms, orders…)
├── lib/                    # db, auth, servicios de dominio
│   └── ai/                 # proveedores de IA (AIContentProvider, AIImageProvider) + interfaces
├── trigger/                # tasks de background (pipeline de generación) + pipeline reutilizable
├── prisma/                 # schema.prisma + migraciones + seeds
├── public/                 # estáticos
├── tests/                  # e2e (Playwright)
├── docs/                   # documentación del proyecto
├── spec/                   # spec driven development
│   ├── constitution/       # misión, tech-stack, roadmap
│   └── features/           # spec, plan, tasks por feature
├── AGENTS.md
└── .env.example
```

## Convenciones

- Todo el contenido visible y la documentación en español.
- Seguir `docs/CONVENCIONES.md` y la `spec/constitution/` (tech-stack) para reglas detalladas.
- Documentar cambios en `docs/CAMBIOS.md`.
- Regla de capas: rutas/Server Actions delegan en `lib/services`; el dominio no importa de `next/*`.

## No hagas

- No instalar dependencias sin avisar.
- No usar `any` en TypeScript sin justificarlo.
- No exponer claves (Gemini, Hugging Face, Supabase) ni subir `.env*`.
- No acoplar la lógica de generación a un proveedor de IA concreto.
- No llamadas reales a Gemini/Hugging Face en CI (usar mocks).
- No integrar la generación IA de forma síncrona en el request (encolar en Trigger.dev; solo fallback inline si no está configurado).

## Flujo de trabajo

1. **Spec primero:** para cada feature, crear `spec/features/NN-nombre/` con `spec.md`, `plan.md` y `tasks.md`. Esperar a que el usuario revise y dé OK antes de tocar código.
2. **Implementar solo con OK:** una vez aprobado el spec, implementar las tareas de `tasks.md` de a una.
3. **Una tarea a la vez; al terminar**, decir qué se cambió para que el usuario lo revise.
4. **Si no estás seguro al 80%,** preguntar. No inventar.
5. **Al terminar,** marcar las tareas en `tasks.md`, mover la feature a "Hecho" en `roadmap.md` y actualizar documentación.
6. La constitución manda: si una feature choca con `mission.md` o `tech-stack.md`, se replantea la feature, no la constitución.

## Datos de la app

- **Entorno:** Next.js full-stack (App Router), Server Components + Server Actions; Route Handlers solo para integraciones externas.
- **Sin pasarela de pago:** `Order.paymentStatus` transiciona `pending → approved` en la confirmación simulada; modelado para integración futura.
- **Catálogo data-driven:** 6 productos definidos por `Product.formSchema` (JSON) y las plantillas `Product.aiTextTemplate` + `Product.aiPromptTemplate`.
- **Generación asíncrona:** task Trigger.dev `generate-dream` → `runGenerationPipeline` (`GENERATE_TEXT (Gemini) → UPLOAD_RESULT → GENERATE_IMAGE (Hugging Face) → MARK_COMPLETED`); si la imagen falla, el pedido queda COMPLETED con el texto y la página ofrece el botón para generarla a demanda (`runImageGenerationInline`); estados `queued / processing / completed / error` con polling del frontend; trazabilidad en `GenerationLog`. Las Server Actions encolan con `enqueueGeneration` (fallback inline si Trigger.dev no está configurado). `saveText` preserva la imagen ya generada.
- **Alcance:** MVP (catálogo, formulario, checkout, generación, resultado), V1 (auth, storage en nube, historial), V2 (optimización, seguridad, analítica, extensibilidad).
