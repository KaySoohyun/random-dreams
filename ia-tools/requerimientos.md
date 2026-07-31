# Random Dreams — Estructura de Plan de Trabajo

---

## FASE 0 · Descubrimiento y Diseño

### Módulo 0.1 — Definición de Producto
- Documento de alcance funcional (MVP / V1 / V2)
- Definición de los 6 productos y sus campos de formulario asociados
- Flujo de usuario (user flow) end-to-end: selección → formulario → pago → generación → entrega

### Módulo 0.2 — Arquitectura Técnica
- Diagrama de arquitectura (frontend, backend, API de IA, storage, pasarela de pago)
- Selección de stack tecnológico
- Definición de proveedor de IA generativa y contrato de API (inputs/outputs)
- Selección de proveedor de almacenamiento cloud (tier gratuito)

### Módulo 0.3 — Diseño UX/UI
- Wireframes de páginas clave (listado, detalle/formulario, checkout, resultado)
- Prototipo navegable (baja/alta fidelidad)
- Sistema de diseño base (componentes UI reutilizables)

### Módulo 0.4 — Modelado de Datos
- Diagrama entidad-relación (ERD) preliminar
- Definición de esquema de base de datos

---

## FASE 1 · MVP

### Módulo 1.1 — Frontend: Catálogo y Selección de Producto
- Página de listado (6 productos)
- Página de detalle de producto
- Componente de selección única (sin carrito acumulativo)

### Módulo 1.2 — Formulario Dinámico por Producto
- Motor de formularios configurable por producto
- Validaciones de campos (frontend + backend)
- Persistencia temporal de la respuesta del formulario

### Módulo 1.3 — Checkout y Pago
- Integración con pasarela de pago
- Flujo de pago unitario (un producto por transacción)
- Manejo de estados de transacción (pendiente/aprobado/rechazado)

### Módulo 1.4 — Integración con API de IA
- Servicio backend de orquestación (form data → payload IA)
- Llamado a la API de IA tras confirmación de pago
- Manejo de estados de generación (en cola/procesando/completado/error)
- Manejo de reintentos y timeouts

### Módulo 1.5 — Entrega de Resultado
- Página de resultado generado
- Botón de descarga directa
- Manejo de formatos de salida soportados

### Módulo 1.6 — Backend Core
- API REST/GraphQL de soporte a los módulos anteriores
- Gestión de órdenes/transacciones
- Logs de generación IA (para trazabilidad y soporte)

### Módulo 1.7 — Testing y Despliegue MVP
- Pruebas funcionales del flujo completo (compra → generación → descarga)
- Pruebas de integración con API de IA y pasarela de pago
- Despliegue en ambiente de producción
- Checklist de QA pre-lanzamiento

---

## FASE 2 · Versión 1 (V1)

### Módulo 2.1 — Autenticación y Cuenta de Usuario
- Registro / login (email, OAuth opcional)
- Recuperación de contraseña
- Perfil básico de usuario

### Módulo 2.2 — Almacenamiento en la Nube
- Integración con servicio de storage (tier gratuito: Supabase Storage / Firebase Storage / Cloudinary)
- Subida automática del resultado generado tras cada compra
- Política de nombrado y organización de archivos por usuario/orden

### Módulo 2.3 — Panel de Usuario / Historial
- Vista de historial de productos generados
- Redescarga de resultados previos
- Asociación de historial a cuenta autenticada

### Módulo 2.4 — Testing y Despliegue V1
- Pruebas de integración: autenticación + storage + historial
- Pruebas de regresión sobre flujo MVP
- Despliegue incremental (feature flag opcional)

---

## FASE 3 · Versión 2 (V2)

### Módulo 3.1 — Optimización y Escalabilidad
- Revisión de performance del llamado a la API de IA (caching, colas asíncronas)
- Optimización de almacenamiento (limpieza/expiración de archivos no reclamados)
- Monitoreo y alertas de servicio (uptime, errores de generación)

### Módulo 3.2 — Seguridad y Cumplimiento
- Hardening de autenticación (roles, permisos)
- Revisión de manejo de datos personales en formularios
- Políticas de retención de archivos generados

### Módulo 3.3 — Analítica de Producto
- Instrumentación de eventos (selección, formulario, pago, generación, descarga)
- Dashboard de métricas de uso y conversión

### Módulo 3.4 — Extensibilidad de Catálogo
- Arquitectura para incorporar nuevos productos sin cambios estructurales
- Panel administrativo básico para gestión de productos/formularios

---

## Site Map (Mapa de Sitio)

```
Home / Landing
├── Catálogo de Productos (listado de 6 productos)
│   └── Detalle de Producto + Formulario Dinámico
│       └── Checkout / Pago
│           └── Estado de Generación (procesando)
│               └── Resultado (visualización + descarga)
├── Login / Registro                         [V1]
├── Panel de Usuario                          [V1]
│   └── Historial de Generaciones
│       └── Redescarga de Resultado
├── Panel Administrativo                      [V2]
│   └── Gestión de Productos / Formularios
├── Páginas Legales
│   ├── Términos y Condiciones
│   ├── Política de Privacidad
│   └── Política de Reembolso
└── Contacto / Soporte
```

### Detalle por página

| Página | Propósito | Público objetivo | Fase |
|---|---|---|---|
| Catálogo de Productos | Presentar los 6 productos disponibles y su propuesta de valor | Usuario nuevo o recurrente que explora opciones | MVP |
| Detalle de Producto + Formulario | Capturar los inputs personalizados necesarios para la generación IA | Usuario que ya seleccionó un producto | MVP |
| Checkout / Pago | Procesar el pago unitario antes de habilitar la generación | Usuario listo para comprar | MVP |
| Estado de Generación | Comunicar el progreso del llamado a la API de IA | Usuario en espera post-pago | MVP |
| Resultado (visualización/descarga) | Mostrar y permitir descargar el output generado | Usuario que completó la compra | MVP |
| Login / Registro | Habilitar identidad persistente para acceder al historial | Usuario recurrente interesado en guardar su historial | V1 |
| Panel de Usuario / Historial | Listar generaciones previas y permitir redescarga | Usuario autenticado | V1 |
| Panel Administrativo | Administrar catálogo, formularios y configuración de IA | Equipo interno / administrador | V2 |
| Páginas Legales | Cumplimiento normativo y transparencia | Todo usuario | MVP |
| Contacto / Soporte | Canalizar consultas o incidencias | Usuario con problemas en el flujo | MVP |

---

## Modelos de Datos Sugeridos

### `User` (V1)
- id
- email
- password_hash / auth_provider
- created_at

### `Product`
- id
- name
- description
- form_schema (definición de campos del formulario dinámico)
- ai_text_template (plantilla de texto del producto, vía IA generativa)
- ai_prompt_template (plantilla de imagen, vía IA generativa)
- active (boolean)

### `Order`
- id
- user_id (nullable en MVP, obligatorio en V1 si hay cuenta)
- product_id
- payment_status (pending / approved / rejected)
- created_at

### `FormSubmission`
- id
- order_id
- form_data (JSON con las respuestas del usuario)
- submitted_at

### `GeneratedResult`
- id
- order_id
- ai_request_payload
- ai_response_status (queued / processing / completed / error)
- result_file_url (referencia al storage cloud)
- file_format
- generated_at

### `StorageAsset` (V1)
- id
- generated_result_id
- storage_provider (supabase / firebase / cloudinary)
- storage_path
- expires_at (opcional, según política de retención)