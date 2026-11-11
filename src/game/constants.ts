import { GridPos, ShapeName } from "./types";

export const GRID_SIZE = 8;
export const TRAY_SIZE = 3;

// Rango de suma válido de la variante números (anyValidSumPath, scoring,
// badge) — MAX_TARGET_SUM es el techo absoluto de todo el juego (25, ver
// NUMBER_GOAL_THRESHOLDS); en la práctica la partida real nunca deja sumar
// cualquier cosa en ese rango, ver el "candado de ventana deslizante" en
// game.tsx + withAllowedSums.
export const MIN_TARGET_SUM = 10;
export const MAX_TARGET_SUM = 25;
export const MIN_PATH_LENGTH_NUMBERS = 2;
export const MIN_PATH_LENGTH_WORDS = 3;
export const MIN_PATH_LENGTH_FRUITS = 3;

// Frutas disponibles para la variante "fruits" — se sortean parejo entre
// todas (a diferencia de números/palabras, acá no hay una frecuencia real
// de la que partir).
export const FRUIT_EMOJI = ["🍎", "🍌", "🍇", "🍊", "🍓", "🍍"];

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

// Paleta de Letris (ver src/utils/letrisColors.ts en letrisReact) — se usa
// solo en la variante "words" para que las letras ya encastradas y el
// camino en curso tengan el mismo aspecto que Letris, en vez del color de
// pieza genérico que siguen usando números y frutas.
export const LETRIS_PALETTE = {
  lockedBg: "#fff",
  selectedBg: "#e74c3c55",
  selectedText: "#e74c3c",
  emptyText: "#333",
};

// Metas de la variante "words" (ver src/components/WordGoals): cada umbral
// se cumple con "N letras o más", no "exactamente N" — así, si la primera
// palabra que formás ya tiene 6 letras, cumplís de una las metas de 3, 4,
// 5 y 6, en vez de quedar trabado esperando una palabra corta que quizás
// no vuelvas a formar. 12 es la última (tope para que la lista no sea
// infinita; cualquier palabra de 12+ letras la cumple).
export const WORD_GOAL_THRESHOLDS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
// Bonus al cumplir una meta: 100 * N letras (ej. la meta de 6 letras da +600).
export const WORD_GOAL_BONUS_PER_LETTER = 100;

// Metas de la variante "numbers" — a diferencia de las de palabras, acá NO
// es "cualquier suma dentro del rango sirve": el juego arranca pidiendo
// sumar 10, y la ventana de sumas habilitadas es siempre {piso, piso+1}
// (ver withAllowedSums en variants/numbers.ts) — se puede sumar la
// "actual" o ya ir por la siguiente, pero ninguna otra. Cada vez que se
// borra algo (sea cual sea de las dos), el piso sube en 1, así que el
// próximo turno exige una suma más alta. 25 es el techo.
export const NUMBER_GOAL_THRESHOLDS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
export const NUMBER_GOAL_BONUS_PER_SUM = 100;

// Metas de la variante "fruits" — mismo modelo que números (ventana
// deslizante {piso, piso+1}, ver withAllowedLengths en variants/fruits.ts):
// arranca pidiendo seleccionar 3 frutas iguales, y cada borrado sube el
// piso en 1, hasta un techo de 15.
export const MAX_FRUIT_GROUP_SIZE = 15;
export const FRUIT_GOAL_THRESHOLDS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
export const FRUIT_GOAL_BONUS_PER_FRUIT = 100;

export const HINTS: Record<"numbers" | "words" | "fruits", string> = {
  numbers:
    'Arrastrá las piezas a la grilla (tocá una para rotarla). Para borrar: apoyá el dedo en un número y recorré los vecinos (también en diagonal) sin soltar. Empezás sumando <b>10</b>; cada vez que borrás algo, la suma pedida sube de a uno.',
  words:
    'Arrastrá las piezas a la grilla (tocá una para rotarla). Para borrar: recorré letras contiguas (también en diagonal) sin soltar. Si forman una <b>palabra</b>, desaparecen.',
  fruits:
    'Arrastrá las piezas a la grilla (tocá una para rotarla). Para borrar: recorré frutas iguales contiguas (también en diagonal) sin soltar. Empezás seleccionando <b>3</b>; cada vez que borrás algo, la cantidad pedida sube de a una.',
};
