import { GRID_SIZE } from "./constants";
import { ColorGrid, Grid, GridPos, Piece } from "./types";
import { rotatePiece } from "./pieces";

export function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

export function createEmptyColorGrid(): ColorGrid {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE;
}

// Todas las celdas de la pieza (en la posición R,C) tienen que caer dentro
// del tablero y estar vacías.
export function canPlace(grid: Grid, piece: Piece, origin: GridPos): boolean {
  return piece.cells.every(({ r, c }) => {
    const gr = origin.r + r;
    const gc = origin.c + c;
    return inBounds(gr, gc) && grid[gr][gc] === null;
  });
}

// Devuelve grillas NUEVAS con la pieza encastrada — no muta las de entrada.
export function place(grid: Grid, colorGrid: ColorGrid, piece: Piece, origin: GridPos): { grid: Grid; colorGrid: ColorGrid } {
  const nextGrid = grid.map((row) => [...row]);
  const nextColorGrid = colorGrid.map((row) => [...row]);
  for (const cell of piece.cells) {
    const gr = origin.r + cell.r;
    const gc = origin.c + cell.c;
    nextGrid[gr][gc] = cell.value;
    nextColorGrid[gr][gc] = piece.color;
  }
  return { grid: nextGrid, colorGrid: nextColorGrid };
}

// ¿Existe alguna rotación de la pieza y alguna posición donde entre? Las 4
// rotaciones se prueban aunque la pieza ya tenga una rotación de partida:
// lo que importa es si ALGUNA orientación entra en algún lado.
export function fitsAnywhere(grid: Grid, piece: Piece): boolean {
  let candidate = piece;
  for (let rotation = 0; rotation < 4; rotation++) {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (canPlace(grid, candidate, { r, c })) return true;
      }
    }
    candidate = rotatePiece(candidate);
  }
  return false;
}

// Distancia de Chebyshev === 1: vecinas en cualquiera de las 8 direcciones
// (incluidas diagonales), pero no la misma celda.
export function isAdjacent8(a: GridPos, b: GridPos): boolean {
  const dr = Math.abs(a.r - b.r);
  const dc = Math.abs(a.c - b.c);
  return Math.max(dr, dc) === 1;
}

export function clearCells(grid: Grid, colorGrid: ColorGrid, path: GridPos[]): { grid: Grid; colorGrid: ColorGrid } {
  const nextGrid = grid.map((row) => [...row]);
  const nextColorGrid = colorGrid.map((row) => [...row]);
  for (const { r, c } of path) {
    nextGrid[r][c] = null;
    nextColorGrid[r][c] = null;
  }
  return { grid: nextGrid, colorGrid: nextColorGrid };
}
