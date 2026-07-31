# Misión

Define la razón de ser del proyecto. Es la referencia que decide si una feature "encaja" o no.

## Qué construimos

**Random Dreams** es una plataforma donde el usuario elige entre **6 productos**, completa un **formulario dinámico** configurable por producto, confirma el pedido y una **API de IA** genera un resultado (texto + imagen) que puede visualizar y descargar. La generación es asíncrona y se orquesta con colas (Inngest), con estados de progreso visibles para el usuario.

1. **Catálogo de 6 productos** — Listado y ficha con detalle; selección única por transacción (sin carrito).
2. **Formulario dinámico por producto** — Motor de formularios configurable desde `Product.form_schema`, con validación Zod en frontend y backend y persistencia de la respuesta.
3. **Checkout y confirmación** — Flujo unitario sin pasarela de pago en esta etapa; `payment_status` queda modelado para una integración futura.
4. **Generación IA asíncrona** — Pipeline Inngest: composición de prompt con Gemini + generación de imagen con Hugging Face, con reintentos, timeouts y trazabilidad (`GenerationLog`).
5. **Entrega del resultado** — Página de resultado con descarga directa; en V1 se persiste en la nube y queda en el historial del usuario.

## Para quién

- **Usuario final** — Personas que buscan contenido personalizado generado por IA a partir de sus inputs (elige producto, completa formulario, descarga el resultado).
- **Equipo interno / administrador** — Gestiona el catálogo de productos y formularios (V2) y monitorea la generación.
- **Interesados** — Cliente/propietario del producto; define alcance funcional (MVP / V1 / V2) y proveedores de IA.

## Principios

- **Catálogo data-driven** — Los productos, sus formularios y sus plantillas de IA viven como datos (`form_schema`, `ai_text_template`, `ai_prompt_template`); agregar un producto no requiere cambios estructurales.
- **Proveedores aislados** — Gemini y Hugging Face se usan detrás de interfaces (`AIContentProvider`, `AIImageProvider`); nunca se acopla el dominio a un proveedor concreto.
- **Generación confiable** — El pipeline es asíncrono, idempotente por orden, con reintentos, timeouts y logs; los errores quedan trazables para soporte.
- **Dominio desacoplado** — La lógica de negocio vive en `lib/services` sin dependencias de Next.js; las rutas y Server Actions solo orquestan.
- **Sin pasarela de pago** — El checkout es una confirmación simulada.

## Qué NO es

- NO es una plataforma de e-commerce con carrito, catálogo masivo ni múltiples métodos de pago.
- NO ejecuta generación de IA en tiempo real síncrono para el usuario; es asíncrona con estados de progreso.
- NO persiste resultados en V0/MVP: la descarga es directa desde el pipeline; el storage en la nube (Supabase) y el historial llegan en V1.
- NO es un marketplace de modelos IA ni permite al usuario elegir modelos/proveedores.
