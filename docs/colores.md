# Paleta de colores — FUENTE DE VERDAD

> **Regla:** estos colores y sus tokens NO se cambian, renombran ni eliminan sin preguntar antes al usuario.
> Están aplicados en `app/globals.css` dentro de `@theme` (Tailwind v4). Si hacés cambios visuales, usá esta paleta; no la modifiques.
> La paleta deriva del diseño en `docs/componentes.md` (tema oscuro "Recuerdos de lo Inexistente").

## Tokens gold-night (paleta principal)

```css
/* en @theme de app/globals.css → utilidades bg-*, text-*, border-* */
--color-night: #0b0f14;           // Fondo principal (casi negro azulado)
--color-night-card: #121820;      // Fondos de tarjetas / secciones
--color-night-panel: #0f151c;     // Fondos de banners / paneles

--color-gold: #d4af37;            // Acento dorado (botones, enlaces, bordes)
--color-gold-hover: #fef08a;      // Dorado al hover / brillo
--color-gold-dim: #a5842a;        // Dorado atenuado

--color-cream: #f8fafc;           // Texto principal (blanco crema)
--color-mist: #121820;            // Placeholders / fondos alternos
--color-ink: #f8fafc;             // Texto principal
--color-ink-muted: #d1d5db;       // Texto de cuerpo
--color-muted: #94a3b8;           // Texto secundario / subtítulos
--color-faint: #64748b;           // Texto atenuado / hints
--color-line: rgba(212,175,55,0.22); // Bordes y divisores dorados
```

### Mapeo de tokens semánticos

Los tokens de uso general apuntan a esta paleta:

```css
--color-surface: #0b0f14;         // fondo de página
--color-mist: #121820;            // fondos alternos
--color-panel: #0f151c;           // banners / paneles
--color-line: rgba(212,175,55,0.22); // bordes
--color-ink: #f8fafc;             // texto principal
--color-ink-muted: #d1d5db;       // texto de cuerpo
--color-muted: #94a3b8;           // texto secundario
--color-faint: #64748b;           // texto atenuado
--color-primary: #d4af37;         // acento dorado
--color-primary-hover: #fef08a;
--color-primary-light: rgba(212,175,55,0.16);
--color-success: #34d399;
--color-warning: #fbbf24;
--color-danger: #f87171;
```

## Tipografía

- Fuente general: **Georgia / serif** (titulares y cuerpo).
- Sans (Inter) disponible vía `--font-sans` para casos puntuales.
- Estilo de marca: títulos en `uppercase` con `letter-spacing`.
