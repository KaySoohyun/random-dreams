# Despliegue del MVP — Guía

Pasos verificables para llevar **Random Dreams** a producción en **Vercel**. Ejecutar el **checklist QA** (`docs/qa-checklist-mvp.md`) antes de cada release.

## Prerrequisitos

- Cuenta en **GitHub** (repo privado recomendado) y en **Vercel**.
- Bases de datos Supabase ya configuradas (dev y producción, si se separan).
- Claves de IA: `GEMINI_API_KEY` (Google AI Studio) y `HF_TOKEN` (Hugging Face).

## 1. Repositorio e historial

```bash
cd app-random-dreams
git init
git add .
git commit -m "chore: MVP Random Dreams (features 001–007)"
git remote add origin git@github.com:<usuario>/random-dreams.git
git push -u origin main
```

> `lib/generated/` y `.env*` están en `.gitignore`: el cliente Prisma se regenera en CI/Vercel con `npx prisma generate` y el entorno se define como variables en Vercel, nunca en el repo.

## 2. Importar en Vercel

1. Vercel → **Add New Project** → importar el repo.
2. Framework preset: **Next.js** (auto-detectado; build `npm run build`, output `standalone` opcional).
3. Definir las **variables de entorno** (ver abajo).
4. Deploy.

### Variables de entorno

| Variable | Valor | Notas |
|---|---|---|
| `DATABASE_URL` | URL del pooler transaccional Supabase (`:6543?pgbouncer=true`) | runtime |
| `DIRECT_URL` | URL session/directa (`:5432`) | solo CLI/migraciones |
| `GEMINI_API_KEY` | clave de Google AI Studio | producción |
| `GEMINI_MODEL` | `gemini-flash-latest` | el free tier rechaza los otros modelos |
| `HF_TOKEN` | token de Hugging Face | producción |
| `AI_MOCK` | `false` | **imprescindible** en producción |
| `ADMIN_TOKEN` | token fuerte del panel admin | generar con `openssl rand -base64 32` |
| `INNGEST_DEV` | vacío/ausente | solo dev local |
| `INNGEST_EVENT_KEY` | clave del evento `order/confirmed` de **Inngest Cloud** | para producción |
| `INNGEST_SIGNING_KEY` | clave de firma de **Inngest Cloud** | para producción |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | reservadas | se usan en 009 (Storage) |

## 3. Migraciones y seeds

Vercel aplica las migraciones antes del build (config `prisma migrate deploy` en el build de Next si se agrega, o en un comando propio). El cliente Prisma **no se regenera** en Vercel por defecto; asegurar que el build corra `npx prisma generate` (p. ej. en `vercel.json` con `installCommand`/`buildCommand`, o un script `postinstall`).

Seed de los 6 productos (una sola vez en la BD de producción):

```bash
npx prisma generate
npx prisma migrate deploy
npm run seed
```

## 4. Inngest Cloud (producción)

1. Crear app en **Inngest Cloud** (`https://app.inngest.com`) con el id `random-dreams`.
2. Copiar `INNGEST_EVENT_KEY` e `INNGEST_SIGNING_KEY` → Vercel.
3. El endpoint de serve es `/api/inngest`; en producción Inngest lo invoca directamente (no hace falta el Dev Server local).
4. Monitorear colas/reintentos en el dashboard de Inngest.

## 5. Verificación post-deploy

- [ ] `/` y `/producto/[slug]` cargan con SSR/SSG correctos.
- [ ] Flujo completo: formulario → checkout → `/generacion/[orderId]` → `COMPLETED` (con Gemini/HF reales) → descarga `.txt` e imagen (extensión correcta).
- [ ] `/admin/login` con el `ADMIN_TOKEN` de producción; dashboard y detalle con `GenerationLog`.
- [ ] `/admin` no indexable; cookie de sesión con `secure` en HTTPS.
- [ ] 404s: `/producto/xx`, `/generacion/xx`.
- [ ] Reintentar una orden en `ERROR` desde `/admin/ordenes/[orderId]`.

## CI/CD

`.github/workflows/ci.yml` corre en cada PR/push a `main`: **lint**, **unit**, **build**, **smoke** (IA mock) y **e2e** (Playwright + Inngest Dev Server). Requiere los secrets de GitHub: `DATABASE_URL`, `DIRECT_URL`, `GEMINI_MODEL`, `ADMIN_TOKEN`.

> Nota: el E2E usa la misma BD de dev (limpia al final). Si se desea una BD aislada para CI, crear una instancia Supabase dedicada y apuntar `DATABASE_URL` del secret a ella.
