# Encastralo

Juego web mobile-first: encastrá piezas en una grilla de 8x8 y borrá
recorridos de casillas contiguas (8 direcciones) — en la variante
**Números**, que sumen 10; en la variante **Palabras**, que formen una
palabra del diccionario.

Mecánica y look tomados de `referencia/encastralo-poc.html` (un solo HTML
de prueba) y reescritos en React + TypeScript + Vite, sin librerías de UI
ni de drag & drop — todo con pointer events nativos.

## Correr en local

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # Vitest, lógica pura de src/game/
npm run build    # tsc -b + vite build -> dist/
```

## Deploy (Netlify)

El repo ya trae `netlify.toml` (`npm run build`, publica `dist/`). Conectar
el repo en Netlify o correr `netlify deploy` apunta solo — no hace falta
configuración extra.

## Arquitectura

- `src/game/` — lógica pura, sin React ni DOM. 100% testeable con Vitest.
  - `types.ts` — tipos compartidos por ambas variantes, incluida la
    interfaz `VariantEngine` (lo único que `useGame`/`usePathSelection`
    necesitan saber de una variante).
  - `constants.ts`, `pieces.ts`, `board.ts`, `pathBuilder.ts`.
  - `variants/numbers.ts` y `variants/words/` (lógica, diccionario,
    builders de `WORD_SET`/`PREFIX_SET`/frecuencia de letras).
- `src/hooks/` — `useGame` (estado con `useReducer`), `usePieceDrag`
  (arrastre pieza→grilla), `usePathSelection` (recorrido de borrado).
- `src/components/` — un componente por pieza de UI (`Board`, `Cell`,
  `Tray`, `DragLayer`, `PathBadge`, `Toast`, `GameOverModal`, etc.), CSS
  Modules para los estilos, compuestos todos en `GameScreen`.

## Reemplazar el diccionario de la variante Palabras

Todo el diccionario vive en **un solo archivo**:
`src/game/variants/words/dictionary.ts` — un array de strings en
MAYÚSCULAS y sin tildes:

```ts
export const DICTIONARY: string[] = ["ABEJA", "ABOGADO", ...];
```

Para enchufar los diccionarios reales de enganchalo/ensopalo, alcanza con
reemplazar ese array por la lista real (misma normalización: mayúsculas,
sin tildes, sin espacios dentro de cada palabra). No hay que tocar nada
más — `dictionaryIndex.ts` recalcula `WORD_SET`, `PREFIX_SET`,
`LETTER_FREQUENCY` y el largo máximo a partir de lo que haya en
`dictionary.ts` en cuanto arranca la app.

Si el diccionario real viene en un formato distinto (JSON, con tildes,
etc.), convertirlo a este array de un solo lugar es el único paso extra.

## Estado pendiente / próximos pasos

- El dominio final (`encastralo.com`) y la cuenta de Google Ads/GA4 todavía
  no existen — `index.html` tiene marcas `TODO` donde va esa información
  real una vez que se decida.
- El favicon es un placeholder genérico (letra "E" sobre el fondo oscuro
  de la paleta del juego).
