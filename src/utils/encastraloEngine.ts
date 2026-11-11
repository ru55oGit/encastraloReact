import { SupportedLanguage } from "../i18n/translations";
import {
  PieceType,
  PIECE_TYPES,
  getSpawnShape,
  rotateMatrixCW,
  rotateMatrixCCW,
  rotateOPieceLetters,
} from "./encastraloPieces";
import { randomWeightedLetter } from "./encastraloLetters";

export const BOARD_WIDTH = 8;
export const BOARD_HEIGHT = 14;
const PIECE_MATRIX_SIZE = 4;
const WALL_KICK_OFFSETS = [0, -1, 1, -2, 2];

export type BoardCell = string | null;
export type Board = BoardCell[][];

export interface FallingPiece {
  type: PieceType;
  matrix: BoardCell[][];
  row: number;
  col: number;
}

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () => Array<BoardCell>(BOARD_WIDTH).fill(null));
}

export function spawnPiece(lang: SupportedLanguage): FallingPiece {
  const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  const shape = getSpawnShape(type);
  const matrix: BoardCell[][] = shape.map((row) =>
    row.map((occupied) => (occupied ? randomWeightedLetter(lang) : null))
  );
  const col = Math.floor((BOARD_WIDTH - PIECE_MATRIX_SIZE) / 2);
  return { type, matrix, row: 0, col };
}

export function hasCollision(
  board: Board,
  matrix: BoardCell[][],
  testRow: number,
  testCol: number
): boolean {
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] === null) continue;
      const boardRow = testRow + r;
      const boardCol = testCol + c;
      if (boardCol < 0 || boardCol >= BOARD_WIDTH) return true;
      if (boardRow >= BOARD_HEIGHT) return true;
      if (boardRow < 0) continue;
      if (board[boardRow][boardCol] !== null) return true;
    }
  }
  return false;
}

export function tryMove(board: Board, piece: FallingPiece, dRow: number, dCol: number): FallingPiece | null {
  const newRow = piece.row + dRow;
  const newCol = piece.col + dCol;
  if (hasCollision(board, piece.matrix, newRow, newCol)) return null;
  return { ...piece, row: newRow, col: newCol };
}

export function tryRotate(board: Board, piece: FallingPiece, dir: "cw" | "ccw"): FallingPiece | null {
  if (piece.type === "O") {
    // La forma no cambia (sigue siendo un cuadrado), pero las 4 letras
    // rotan entre sí — acá sí sirve, a diferencia del Tetris clásico.
    return { ...piece, matrix: rotateOPieceLetters(piece.matrix, dir) };
  }

  const rotated = dir === "cw" ? rotateMatrixCW(piece.matrix) : rotateMatrixCCW(piece.matrix);

  for (const kick of WALL_KICK_OFFSETS) {
    const kickedCol = piece.col + kick;
    if (!hasCollision(board, rotated, piece.row, kickedCol)) {
      return { ...piece, matrix: rotated, col: kickedCol };
    }
  }
  return null;
}

// El objetivo de cada nivel crece de a WORDS_PER_LEVEL_STEP palabras: el
// nivel 1 pide 5, el nivel 2 pide 10 (dentro de ese nivel, no acumulado
// desde el principio), el nivel 3 pide 15, etc. Al completar un nivel se
// vacía la grilla, se muestra un cartel y sube la dificultad.
export const WORDS_PER_LEVEL_STEP = 5;

// Palabras necesarias PARA completar el nivel dado (no acumulado).
export function wordsRequiredForLevel(level: number): number {
  return level * WORDS_PER_LEVEL_STEP;
}

// Total acumulado de palabras encontradas necesario para haber
// completado los niveles 1..level.
function cumulativeWordsThroughLevel(level: number): number {
  return (WORDS_PER_LEVEL_STEP * level * (level + 1)) / 2;
}

export function levelFromWordsFound(wordsFound: number): number {
  let level = 1;
  while (wordsFound >= cumulativeWordsThroughLevel(level)) level++;
  return level;
}

// Cuántas palabras lleva encontradas dentro del nivel actual (0 justo
// después de completar un nivel, hasta wordsRequiredForLevel(level) - 1).
export function wordsIntoCurrentLevel(wordsFound: number): number {
  const level = levelFromWordsFound(wordsFound);
  const previousThreshold = level === 1 ? 0 : cumulativeWordsThroughLevel(level - 1);
  return wordsFound - previousThreshold;
}

export function gravityIntervalMs(level: number): number {
  return Math.max(450, 2000 - (level - 1) * 50);
}

export interface LockResult {
  board: Board;
  gameOver: boolean;
}

export function lockPiece(board: Board, piece: FallingPiece): LockResult {
  const newBoard = board.map((row) => [...row]);
  let gameOver = false;

  for (let r = 0; r < piece.matrix.length; r++) {
    for (let c = 0; c < piece.matrix[r].length; c++) {
      const letter = piece.matrix[r][c];
      if (letter === null) continue;
      const boardRow = piece.row + r;
      const boardCol = piece.col + c;
      if (boardRow < 0) {
        gameOver = true;
        continue;
      }
      newBoard[boardRow][boardCol] = letter;
    }
  }

  return { board: newBoard, gameOver };
}

// Recompensa de "mirá un video y seguí jugando" tras un game over: en vez
// de reiniciar del todo, se borra la mitad superior del tablero (deja la
// mitad inferior intacta) y el juego sigue desde ahí con más aire.
export function clearTopHalf(board: Board): Board {
  const half = Math.floor(BOARD_HEIGHT / 2);
  return board.map((row, r) => (r < half ? Array<BoardCell>(BOARD_WIDTH).fill(null) : [...row]));
}

// Después de sacar las celdas de una palabra encontrada, cada columna
// afectada colapsa de forma independiente: las letras de arriba caen para
// ocupar los huecos, como en un match-3.
export function collapseColumns(board: Board, columns: Set<number>): Board {
  const newBoard = board.map((row) => [...row]);

  for (const col of columns) {
    const letters: BoardCell[] = [];
    for (let row = 0; row < BOARD_HEIGHT; row++) {
      if (newBoard[row][col] !== null) letters.push(newBoard[row][col]);
    }
    const emptyCount = BOARD_HEIGHT - letters.length;
    for (let row = 0; row < BOARD_HEIGHT; row++) {
      newBoard[row][col] = row < emptyCount ? null : letters[row - emptyCount];
    }
  }

  return newBoard;
}
