import { SupportedLanguage } from "../i18n/translations";
import { isValidWord } from "../data/dictionaries";
import { Board } from "./encastraloEngine";

export interface GridCell {
  row: number;
  col: number;
}

// Las piezas de Tetris casi nunca dejan sus 4 letras en línea recta (solo
// la pieza I lo hace); T/S/Z/J/L quedan en clusters con forma de codo. Por
// eso la selección es "camino de celdas vecinas" al estilo Boggle, no
// línea recta: cada paso solo tiene que tocar (en las 8 direcciones) a la
// celda anterior del camino.
export function areAdjacent(a: GridCell, b: GridCell): boolean {
  const dRow = Math.abs(a.row - b.row);
  const dCol = Math.abs(a.col - b.col);
  return dRow <= 1 && dCol <= 1 && !(dRow === 0 && dCol === 0);
}

function extractWord(board: Board, cells: GridCell[]): string | null {
  let word = "";
  for (const { row, col } of cells) {
    const letter = board[row]?.[col];
    if (!letter) return null; // alguna celda de la selección está vacía
    word += letter;
  }
  return word;
}

export type SelectionResult =
  | { status: "invalid" }
  | { status: "new"; word: string; cells: GridCell[]; points: number }
  | { status: "repeat"; word: string; points: number };

function pointsForWord(word: string): number {
  const lengthBonus = Math.max(0, word.length - 4);
  return 10 + lengthBonus;
}

export function evaluateSelection(
  board: Board,
  cells: GridCell[],
  lang: SupportedLanguage,
  usedWords: Set<string>
): SelectionResult {
  if (cells.length < 3) return { status: "invalid" };

  const forward = extractWord(board, cells);
  if (!forward) return { status: "invalid" };
  const backward = [...forward].reverse().join("");

  const word = isValidWord(forward, lang) ? forward : isValidWord(backward, lang) ? backward : null;
  if (!word) return { status: "invalid" };

  if (usedWords.has(word)) {
    return { status: "repeat", word, points: -1 };
  }

  return { status: "new", word, cells, points: pointsForWord(word) };
}

export function columnsFromCells(cells: GridCell[]): Set<number> {
  return new Set(cells.map((c) => c.col));
}
