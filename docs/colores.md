# Paleta de colores — FUENTE DE VERDAD

> **Regla:** estos colores y sus tokens NO se cambian, renombran ni eliminan sin preguntar antes al usuario.
> Están aplicados en `app/globals.css` dentro de `@theme` (Tailwind v4). Si hacés cambios visuales, usá esta paleta; no la modifiques.

## Tokens candy (paleta principal)

```css
/* en @theme de app/globals.css → utilidades bg-candy-*, text-candy-*, border-candy-* */
--color-candy-pink: #F8A8E8;
--color-candy-rose: #FE98D6;
--color-candy-coral: #FFA9BB;
--color-candy-lavender: #B8BAFD;
--color-candy-sky: #AEDDFA;

--color-candy-plum-dark: #2C1328;    // Texto principal cálido
--color-candy-plum-muted: #4A2E46;   // Subtítulos cálidos
--color-candy-navy-dark: #141C38;    // Texto principal frío
--color-candy-charcoal: #1A1D20;     // Texto neutro
```

## Configuración Tailwind

```js
// Equivalente en Tailwind v3 (por referencia; el proyecto usa v4 con @theme)
module.exports = {
  theme: {
    extend: {
      colors: {
        'candy': {
          'pink': '#F8A8E8',
          'rose': '#FE98D6',
          'coral': '#FFA9BB',
          'lavender': '#B8BAFD',
          'sky': '#AEDDFA',

          'plum-dark': '#2C1328',   // Texto principal cálido
          'plum-muted': '#4A2E46',  // Subtítulos cálidos
          'navy-dark': '#141C38',   // Texto principal frío
          'charcoal': '#1A1D20',    // Texto neutro
        }
      }
    }
  }
}
```
