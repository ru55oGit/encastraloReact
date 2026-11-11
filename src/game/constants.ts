import { GridPos, ShapeName } from "./types";

export const GRID_SIZE = 8;
export const TRAY_SIZE = 3;

// Suma objetivo de la variante números (anyPathOf10, scoring, badge).
export const TARGET_SUM = 10;
export const MIN_PATH_LENGTH_NUMBERS = 2;
export const MIN_PATH_LENGTH_WORDS = 3;

// Índice 0 sin usar (no existe el dígito 0) — pesos más altos en los
// números bajos para que sea viable combinar sumas de 10 seguido.
export const NUMBER_WEIGHTS = [0, 16, 16, 15, 13, 12, 9, 8, 6, 5];

export const KEYCAP_EMOJI = ["", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];

export const SHAPE_CELLS: Record<ShapeName, [number, number][]> = {
  punto: [[0, 0]],
  I2: [[0, 0], [1, 0]],
  I3: [[0, 0], [1, 0], [2, 0]],
  L: [[0, 0], [1, 0], [2, 0], [2, 1]],
  T: [[0, 0], [0, 1], [0, 2], [1, 1]],
  U: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]],
  Z: [[0, 0], [0, 1], [1, 1], [1, 2]],
};

// Las formas chicas (punto, I2) salen más seguido que las grandes — mismo
// pool que el POC.
export const SHAPE_POOL: ShapeName[] = ["punto", "punto", "I2", "I3", "L", "L", "T", "U", "Z", "Z"];

export const PIECE_COLORS = ["#7b6cf6", "#f67ba8", "#4fc3f7", "#f6a04d", "#5ee1a0", "#c77dff"];

export const DIRECTIONS_8: GridPos[] = [
  { r: 1, c: 0 }, { r: -1, c: 0 }, { r: 0, c: 1 }, { r: 0, c: -1 },
  { r: 1, c: 1 }, { r: 1, c: -1 }, { r: -1, c: 1 }, { r: -1, c: -1 },
];

// Una casilla solo se agrega al camino si el puntero está en su zona
// central (±36% del centro) — evita tomarla por rozar una esquina desde
// la celda vecina.
export const STRICT_ZONE_RATIO = 0.36;

// La pieza arrastrada va desplazada por encima del dedo/cursor para que no
// quede tapada — más en touch (el dedo es más ancho que un puntero).
export const DRAG_LIFT_PX = { mouse: 20, touch: 70 };

export const HINTS: Record<"numbers" | "words", string> = {
  numbers:
    'Arrastrá las piezas a la grilla (tocá una para rotarla). Para borrar: apoyá el dedo en un número y recorré los vecinos (también en diagonal) sin soltar. Si suman <b>10</b>, desaparecen.',
  words:
    'Arrastrá las piezas a la grilla (tocá una para rotarla). Para borrar: recorré letras contiguas (también en diagonal) sin soltar. Si forman una <b>palabra</b>, desaparecen.',
};
