// Piezas de Tetris representadas como matriz 4x4 booleana (convención
// "guideline" clásica, orientación de spawn). Rotarlas es simplemente
// rotar la matriz 90°, así que si guardamos las letras DENTRO de la
// matriz (en vez de en una lista aparte con offsets por rotación), la
// identidad "esta celda tiene esta letra" viaja sola al rotar.

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export const PIECE_TYPES: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

// true = celda ocupada por la pieza en su rotación de spawn.
const SHAPES: Record<PieceType, boolean[][]> = {
  I: [
    [false, false, false, false],
    [true, true, true, true],
    [false, false, false, false],
    [false, false, false, false],
  ],
  O: [
    [false, true, true, false],
    [false, true, true, false],
    [false, false, false, false],
    [false, false, false, false],
  ],
  T: [
    [false, true, false, false],
    [true, true, true, false],
    [false, false, false, false],
    [false, false, false, false],
  ],
  S: [
    [false, true, true, false],
    [true, true, false, false],
    [false, false, false, false],
    [false, false, false, false],
  ],
  Z: [
    [true, true, false, false],
    [false, true, true, false],
    [false, false, false, false],
    [false, false, false, false],
  ],
  J: [
    [true, false, false, false],
    [true, true, true, false],
    [false, false, false, false],
    [false, false, false, false],
  ],
  L: [
    [false, false, true, false],
    [true, true, true, false],
    [false, false, false, false],
    [false, false, false, false],
  ],
};

export const PIECE_COLORS: Record<PieceType, string> = {
  I: "#3ba7e0",
  O: "#e0c93b",
  T: "#a35be0",
  S: "#4fbf6b",
  Z: "#e05c5c",
  J: "#4a6de0",
  L: "#e08a3b",
};

export function getSpawnShape(type: PieceType): boolean[][] {
  return SHAPES[type].map((row) => [...row]);
}

// Rota una matriz NxN 90° en sentido horario.
export function rotateMatrixCW<T>(matrix: T[][]): T[][] {
  const n = matrix.length;
  const result: T[][] = Array.from({ length: n }, () => new Array(n));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      result[c][n - 1 - r] = matrix[r][c];
    }
  }
  return result;
}

export function rotateMatrixCCW<T>(matrix: T[][]): T[][] {
  const n = matrix.length;
  const result: T[][] = Array.from({ length: n }, () => new Array(n));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      result[n - 1 - c][r] = matrix[r][c];
    }
  }
  return result;
}

// La pieza O ocupa un 2x2 que no está centrado en la caja 4x4, así que
// rotar la matriz entera (como con las demás piezas) la desplazaría de
// lugar. Visualmente un cuadrado rotado se ve igual, pero acá cada celda
// tiene una letra distinta, así que "rotarla" tiene sentido: permuta las
// 4 letras entre sí sin mover la pieza (las 4 celdas ocupadas quedan
// exactamente donde estaban).
const O_TL: [number, number] = [0, 1];
const O_TR: [number, number] = [0, 2];
const O_BL: [number, number] = [1, 1];
const O_BR: [number, number] = [1, 2];

export function rotateOPieceLetters<T>(matrix: T[][], dir: "cw" | "ccw"): T[][] {
  const result = matrix.map((row) => [...row]);
  const [tlR, tlC] = O_TL;
  const [trR, trC] = O_TR;
  const [blR, blC] = O_BL;
  const [brR, brC] = O_BR;
  const tl = matrix[tlR][tlC];
  const tr = matrix[trR][trC];
  const bl = matrix[blR][blC];
  const br = matrix[brR][brC];

  if (dir === "cw") {
    result[trR][trC] = tl;
    result[brR][brC] = tr;
    result[blR][blC] = br;
    result[tlR][tlC] = bl;
  } else {
    result[tlR][tlC] = tr;
    result[trR][trC] = br;
    result[brR][brC] = bl;
    result[blR][blC] = tl;
  }

  return result;
}
