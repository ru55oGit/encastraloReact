import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import { useLanguage } from "../../i18n/LanguageContext";
import { SupportedLanguage } from "../../i18n/translations";
import { PIECE_TYPES, PIECE_COLORS, getSpawnShape, PieceType } from "../../utils/encastraloPieces";
import { randomWeightedLetter } from "../../utils/encastraloLetters";
import type { BoardCell, FallingPiece } from "../../utils/encastraloEngine";
import {
  CELL_SELECTED_BG,
  CELL_SELECTED_TEXT,
  CELL_SUCCESS_BG,
  CELL_LOCKED_BG,
  CELL_EMPTY_BG,
  CELL_EMPTY_TEXT,
} from "../../utils/encastraloColors";

interface Cell {
  row: number;
  col: number;
}

const DEMO_COLS = 8;
const DEMO_ROWS = 7;
const WORD_ROW = 4;
const WORD_START_COL = 2;
const PIECE_LANDED_ROW = 2; // fila (top-left de la matriz 4x4) donde queda apoyada la pieza, justo arriba de la palabra recta

const DEMO_WORDS: Record<SupportedLanguage, string> = { es: "CASA", en: "PLAY", pt: "JOGO" };
const DEMO_WORD_LENGTH = 4; // las 3 palabras de arriba miden lo mismo

// Camino doblado (no en línea recta) para la segunda demostración: baja,
// dobla a la izquierda, vuelve a bajar — cada paso toca al anterior, como
// exige la selección real, pero nunca forma una línea recta.
function bentPathCells(): Cell[] {
  return [
    { row: WORD_ROW, col: DEMO_COLS - 1 },
    { row: WORD_ROW + 1, col: DEMO_COLS - 1 },
    { row: WORD_ROW + 1, col: DEMO_COLS - 2 },
    { row: WORD_ROW + 2, col: DEMO_COLS - 2 },
  ];
}

function straightPathCells(): Cell[] {
  return Array.from({ length: DEMO_WORD_LENGTH }, (_, i) => ({ row: WORD_ROW, col: WORD_START_COL + i }));
}

const FALL_STEP_MS = 350;
const LANDED_PAUSE_MS = 500;
const SELECT_STEP_MS = 150;
const FOUND_FLASH_MS = 450;
const COLLAPSE_PAUSE_MS = 700;
const BETWEEN_ROUNDS_PAUSE_MS = 500;
const RESET_PAUSE_MS = 900;

function cellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

function placeWord(board: BoardCell[][], word: string, cells: Cell[]): void {
  cells.forEach((cell, i) => {
    board[cell.row][cell.col] = word[i];
  });
}

function buildInitialBoard(lang: SupportedLanguage): BoardCell[][] {
  const board: BoardCell[][] = Array.from({ length: DEMO_ROWS }, () => Array<BoardCell>(DEMO_COLS).fill(null));
  const word = DEMO_WORDS[lang];

  placeWord(board, word, straightPathCells());
  placeWord(board, word, bentPathCells());

  for (const row of [WORD_ROW, WORD_ROW + 1, WORD_ROW + 2]) {
    for (let col = 0; col < DEMO_COLS; col++) {
      if (board[row][col] !== null) continue; // no pisar las palabras ya colocadas
      if (Math.random() < 0.55) board[row][col] = randomWeightedLetter(lang);
    }
  }

  return board;
}

function spawnDemoPiece(lang: SupportedLanguage, startRow: number): FallingPiece {
  const type: PieceType = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  const shape = getSpawnShape(type);
  const matrix = shape.map((row) => row.map((occupied) => (occupied ? randomWeightedLetter(lang) : null)));
  return { type, matrix, row: startRow, col: WORD_START_COL };
}

function collapseDemoColumns(board: BoardCell[][], columns: Iterable<number>): BoardCell[][] {
  const next = board.map((row) => [...row]);
  for (const col of columns) {
    const letters: BoardCell[] = [];
    for (let row = 0; row < DEMO_ROWS; row++) {
      if (next[row][col] !== null) letters.push(next[row][col]);
    }
    const emptyCount = DEMO_ROWS - letters.length;
    for (let row = 0; row < DEMO_ROWS; row++) {
      next[row][col] = row < emptyCount ? null : letters[row - emptyCount];
    }
  }
  return next;
}

export default function HowToPlayDemo() {
  const { currentLanguage } = useLanguage();
  const [board, setBoard] = useState<BoardCell[][]>(() => buildInitialBoard(currentLanguage));
  const [piece, setPiece] = useState<FallingPiece | null>(() => spawnDemoPiece(currentLanguage, -1));
  const [selectionPath, setSelectionPath] = useState<Cell[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [flashSuccess, setFlashSuccess] = useState(false);

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    function schedule(fn: () => void, delay: number) {
      const id = setTimeout(fn, delay);
      timeoutsRef.current.push(id);
    }

    // Anima la selección progresiva de `cells` (en el orden del camino,
    // recto o doblado, da igual), flashea en verde y limpia+colapsa.
    // Devuelve cuánto delay total consumió.
    function scheduleSelectionRound(cells: Cell[], startDelay: number): number {
      let delay = startDelay;

      schedule(() => setSelectionPath(cells), delay);
      for (let i = 1; i <= cells.length; i++) {
        schedule(() => setSelectedCount(i), delay + SELECT_STEP_MS * i);
      }
      delay += SELECT_STEP_MS * cells.length;

      schedule(() => setFlashSuccess(true), delay + 150);
      delay += 150;

      schedule(() => {
        setFlashSuccess(false);
        setSelectedCount(0);
        setSelectionPath([]);
        setBoard((prev) => {
          const cleared = prev.map((r) => [...r]);
          for (const { row, col } of cells) cleared[row][col] = null;
          return collapseDemoColumns(cleared, new Set(cells.map((c) => c.col)));
        });
      }, delay + FOUND_FLASH_MS);
      delay += FOUND_FLASH_MS;

      return delay;
    }

    function runCycle() {
      const lang = currentLanguage;

      setBoard(buildInitialBoard(lang));
      setSelectedCount(0);
      setSelectionPath([]);
      setFlashSuccess(false);

      let fallingPiece = spawnDemoPiece(lang, -1);
      setPiece(fallingPiece);

      // Caída: -1 -> 0 -> 1 -> 2 (PIECE_LANDED_ROW), justo arriba de la palabra recta.
      let delay = FALL_STEP_MS;
      for (let row = 0; row <= PIECE_LANDED_ROW; row++) {
        schedule(() => {
          fallingPiece = { ...fallingPiece, row };
          setPiece({ ...fallingPiece });
        }, delay);
        delay += FALL_STEP_MS;
      }

      // Pausa aterrizado, después se funde la pieza al tablero.
      schedule(() => {
        setBoard((prev) => {
          const next = prev.map((r) => [...r]);
          for (let r = 0; r < fallingPiece.matrix.length; r++) {
            for (let c = 0; c < fallingPiece.matrix[r].length; c++) {
              const letter = fallingPiece.matrix[r][c];
              if (!letter) continue;
              const boardRow = fallingPiece.row + r;
              const boardCol = fallingPiece.col + c;
              if (boardRow < 0 || boardRow >= DEMO_ROWS) continue;
              next[boardRow][boardCol] = letter;
            }
          }
          return next;
        });
        setPiece(null);
      }, delay + LANDED_PAUSE_MS);
      delay += LANDED_PAUSE_MS;

      // Ronda 1: selección en línea recta (la pieza que acaba de caer
      // encastra justo arriba, así se ve cómo colapsa después).
      delay = scheduleSelectionRound(straightPathCells(), delay);

      // Ronda 2: selección en camino doblado — misma mecánica, otra forma.
      delay += BETWEEN_ROUNDS_PAUSE_MS;
      delay = scheduleSelectionRound(bentPathCells(), delay);

      // Pausa final mostrando el resultado, después reinicia el ciclo.
      schedule(runCycle, delay + COLLAPSE_PAUSE_MS + RESET_PAUSE_MS);
    }

    runCycle();

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLanguage]);

  const fallingMap = new Map<string, string>();
  if (piece) {
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        const letter = piece.matrix[r][c];
        if (!letter) continue;
        const boardRow = piece.row + r;
        const boardCol = piece.col + c;
        if (boardRow < 0 || boardRow >= DEMO_ROWS) continue;
        fallingMap.set(cellKey(boardRow, boardCol), letter);
      }
    }
  }

  const selectedKeys = new Set(
    selectionPath.slice(0, selectedCount).map((c) => cellKey(c.row, c.col))
  );

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${DEMO_COLS}, 1fr)`,
        gridTemplateRows: `repeat(${DEMO_ROWS}, 1fr)`,
        gap: "2px",
        width: "100%",
        aspectRatio: `${DEMO_COLS} / ${DEMO_ROWS}`,
      }}
    >
      {board.map((rowArr, r) =>
        rowArr.map((letter, c) => {
          const key = cellKey(r, c);
          const fallingLetter = fallingMap.get(key);
          const isFalling = Boolean(fallingLetter) && !letter;
          const isSelected = selectedKeys.has(key);
          const displayLetter = letter ?? fallingLetter ?? "";

          let backgroundColor: string = CELL_EMPTY_BG;
          let color: string = CELL_EMPTY_TEXT;
          if (isSelected && flashSuccess) {
            backgroundColor = CELL_SUCCESS_BG;
            color = "#fff";
          } else if (isSelected) {
            backgroundColor = CELL_SELECTED_BG;
            color = CELL_SELECTED_TEXT;
          } else if (isFalling && piece) {
            backgroundColor = PIECE_COLORS[piece.type];
            color = "#fff";
          } else if (letter) {
            backgroundColor = CELL_LOCKED_BG;
          }

          return (
            <Box
              key={key}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "3px",
                fontWeight: 800,
                fontSize: { xs: 11, sm: 13 },
                fontFamily: "monospace",
                backgroundColor,
                color,
                border: letter ? "1px solid #ddd" : "none",
                transition: "background-color 0.15s, color 0.15s",
              }}
            >
              {displayLetter}
            </Box>
          );
        })
      )}
    </Box>
  );
}
