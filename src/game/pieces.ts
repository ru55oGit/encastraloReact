import { PIECE_COLORS, SHAPE_CELLS, SHAPE_POOL } from "./constants";
import { CellValue, Piece, PieceCell, ShapeName } from "./types";

let nextPieceId = 0;
function makePieceId(): string {
  nextPieceId += 1;
  return `piece-${nextPieceId}`;
}

// Corre todas las celdas para que la más chica de cada eje quede en 0 —
// necesario después de rotar, porque rotar(r,c) -> (c,-r) puede dejar
// coordenadas negativas.
export function normalizeCells(cells: PieceCell[]): PieceCell[] {
  const minR = Math.min(...cells.map((cell) => cell.r));
  const minC = Math.min(...cells.map((cell) => cell.c));
  return cells.map((cell) => ({ ...cell, r: cell.r - minR, c: cell.c - minC }));
}

// Rotación 90° en sentido horario: (r,c) -> (c,-r), después normalizada.
export function rotatePiece(piece: Piece): Piece {
  const rotatedCells = piece.cells.map((cell) => ({ r: cell.c, c: -cell.r, value: cell.value }));
  return { ...piece, cells: normalizeCells(rotatedCells) };
}

export function pieceDims(piece: Piece): { width: number; height: number } {
  return {
    height: Math.max(...piece.cells.map((cell) => cell.r)) + 1,
    width: Math.max(...piece.cells.map((cell) => cell.c)) + 1,
  };
}

function randomShape(): ShapeName {
  return SHAPE_POOL[Math.floor(Math.random() * SHAPE_POOL.length)];
}

function randomColor(): string {
  return PIECE_COLORS[Math.floor(Math.random() * PIECE_COLORS.length)];
}

// Crea una pieza con forma, color y valores por celda aleatorios, con una
// rotación de partida también aleatoria (0 a 3 giros de 90°).
export function createPiece(shape: ShapeName, randomValue: () => CellValue): Piece {
  const cells: PieceCell[] = SHAPE_CELLS[shape].map(([r, c]) => ({ r, c, value: randomValue() }));
  let piece: Piece = { id: makePieceId(), shape, cells, color: randomColor() };

  const spins = Math.floor(Math.random() * 4);
  for (let i = 0; i < spins; i++) piece = rotatePiece(piece);

  return piece;
}

export function createRandomPiece(randomValue: () => CellValue): Piece {
  return createPiece(randomShape(), randomValue);
}
