# Contrato de API de IA — Random Dreams

> Proyecto: Random Dreams — generación IA de contenido personalizado
> Versión del contrato: **v1.1**
> Estado: validado en spike 0.2 (modelo de texto y endpoint de imagen reales probados end-to-end); pendiente validar fidelidad por producto

---

## 1. Objetivo

Define los inputs/outputs de la integración con IA. Es la referencia que el pipeline Inngest debe respetar. Cualquier cambio de proveedor, modelo o formato implica versionar este contrato.

## 2. Interfaz del pipeline

```
Input  → { productId, form_data, ai_text_template, ai_prompt_template }
Output → { text_file: { name, content, format }, image_file: { name, bytes, format } }
```

### 2.1 Input del pipeline

| Campo | Tipo | Descripción |
|---|---|---|
| `productId` | string | Identificador del producto (`Product.id`) |
| `form_data` | JSON | Respuestas validadas del formulario (`FormSubmission.formData`) |
| `ai_text_template` | string | Plantilla del texto del producto (`Product.aiTextTemplate`) |
| `ai_prompt_template` | string | Plantilla de la imagen (`Product.aiPromptTemplate`) |

Reglas:
- `form_data` ya fue validada con Zod antes de entrar al pipeline; no se re-valida aquí.
- Las plantillas usan placeholders `{campo}` que se interpolan desde `form_data`. **Nunca** se interpola texto crudo del usuario fuera de las plantillas.
- El input se persiste en `GeneratedResult.aiRequestPayload` (trazabilidad).

### 2.2 Output del pipeline

| Campo | Tipo | Descripción |
|---|---|---|
| `text_file.name` | string | Ej. `resultado.txt` |
| `text_file.content` | string | Texto del producto (UTF-8) |
| `text_file.format` | `'txt'` | Formato de texto (decisión 0.2) |
| `image_file.name` | string | Ej. `resultado.png` |
| `image_file.bytes` | Buffer | Binario de la imagen |
| `image_file.format` | `'png'` | Formato de imagen (decisión 0.2) |

## 3. Texto — Google Gemini

### 3.1 Proveedor

- **SDK:** `@google/genai` (`GoogleGenAI`, timeout 30 s vía `httpOptions.timeout`)
- **Modelo:** `gemini-flash-latest` (el free tier rechaza `gemini-2.0-flash` con 429 límite 0; `gemini-2.5-*` y `gemini-1.5-flash` dan 404 por deprecación). Configurable con `GEMINI_MODEL`.
- **Credencial:** `GEMINI_API_KEY` (secret de servidor, nunca en `NEXT_PUBLIC_*`)

### 3.2 Responsabilidades

1. **Generar el texto del producto** interpolando `ai_text_template` con `form_data`.
2. **Componer el prompt de imagen final** a partir de `ai_prompt_template` + `form_data` (opción A; ver §6).

### 3.3 Salida

- Texto plano UTF-8 (el contenido se guarda como `.txt`).
- Longitud objetivo: limitar con el prompt (ej. 500–800 palabras); validar en el spike.

### 3.4 Límites

- Timeout de llamada: **30 s** (configurable).
- Reintentos: a cargo de Inngest (backoff exponencial).

## 4. Imagen — Hugging Face (FLUX.1-schnell)

### 4.1 Proveedor

- **Método:** Inference Providers REST por **fal-ai** (`POST https://router.huggingface.co/fal-ai/fal-ai/flux/schnell`, body `{ prompt }`). El router rechaza `FLUX.1-schnell` para `hf-inference`/`replicate`/`nscale`/`together` ("Model not supported") y el proveedor fal-ai devuelve la URL del archivo en JSON (`images[0].url`) que luego se descarga.
- **Auth:** `Authorization: Bearer $HF_TOKEN` (secret de servidor)
- **Modelo:** `FLUX.1-schnell` vía fal-ai (providerId `fal-ai/flux/schnell`); validado en el spike 0.2.

### 4.2 Salida

- Imagen **JPEG** (fal-ai FLUX.1-schnell devuelve `content_type: image/jpeg`; 1024×768 observado). El contrato original asumía PNG 1:1.
- Bytes descargados de `images[0].url` y persistidos; el nombre de archivo se deriva de los bytes (`resultado.png` para mock, `resultado.jpg` para fal-ai) vía `lib/ai/image-format.ts`.

### 4.3 Límites

- Timeout de llamada: **120 s** (configurable), cubre generación + descarga.
- Rate limits/créditos del plan de HF: los reintentos con backoff son obligatorios; 429/5xx y fallos de descarga se tratan como transitorios.

## 5. Errores y reintentos

- **Errores transitorios** (429 rate limit, 5xx, timeout de red): reintento con backoff exponencial por Inngest.
- **Errores de validación** (plantilla sin placeholder, campos faltantes): error permanente → `GeneratedResult.aiResponseStatus = 'error'`, log en `GenerationLog`.
- Si se agotan los reintentos: estado `error`, log y **botón manual de reintento** en el frontend (decisión 0.1).
- Todo paso escribe en `GenerationLog` (`step`, `status`, `payload`, `error`).

## 6. Composición del prompt de imagen (a validar en spike)

| Opción | Prompt de imagen | Ventaja | Riesgo |
|---|---|---|---|
| A | Compuesto por **Gemini** (refina `ai_prompt_template` + `form_data`) | Mayor coherencia con el texto generado | Dependencia extra del modelo de texto; posible deriva de estilo |
| B | **Plantilla interpolada** directamente (`ai_prompt_template` con `form_data`) | Fiel al diseño del producto | Menos refinamiento del prompt |

**Decisión (spike 0.2):** implementada la **opción A** (Gemini compone el prompt de imagen dentro de `AIContentProvider`, aislada para poder pasar a B sin tocar el pipeline). La validación de fidelidad por producto queda pendiente de una muestra con claves reales por producto.

## 7. Registro de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| v1.2 | 2026-07-31 | Nombre de archivo de imagen derivado de los bytes reales (`resultado.png`/`resultado.jpg` según formato) |
| v1.1 | 2026-07-31 | Spike 0.2: modelo de texto real `gemini-flash-latest`; endpoint de imagen real fal-ai (`router.huggingface.co/fal-ai/fal-ai/flux/schnell`, body `{ prompt }`, salida JPEG descargada de `images[0].url`); opción A de composición de prompt implementada |
| v1.0 | 2026-07-31 | Contrato inicial (Gemini flash + FLUX.1-schnell; salida `.txt` + `.png`) |
