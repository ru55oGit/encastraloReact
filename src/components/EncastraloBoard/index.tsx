import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import { Board, FallingPiece, BOARD_WIDTH, BOARD_HEIGHT } from "../../utils/encastraloEngine";
import { areAdjacent, GridCell } from "../../utils/encastraloWords";
import { PIECE_COLORS } from "../../utils/encastraloPieces";
import {
  CELL_SELECTED_BG,
  CELL_SELECTED_TEXT,
  CELL_SUCCESS_BG,
  CELL_ERROR_BG,
  CELL_LOCKED_BG,
  CELL_EMPTY_BG,
  CELL_EMPTY_TEXT,
} from "../../utils/encastraloColors";

interface EncastraloBoardProps {
  board: Board;
  fallingPiece: FallingPiece | null;
  onSelectionEnd: (cells: GridCell[]) => void;
  flashCells?: { cells: GridCell[]; kind: "success" | "error" } | null;
}

function cellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

export default function EncastraloBoard({ board, fallingPiece, onSelectionEnd, flashCells }: EncastraloBoardProps) {
  const [selection, setSelection] = useState<GridCell[]>([]);
  const startRef = useRef<GridCell | null>(null);

  const fallingMap = new Map<string, string>();
  if (fallingPiece) {
    for (let r = 0; r < fallingPiece.matrix.length; r++) {
      for (let c = 0; c < fallingPiece.matrix[r].length; c++) {
        const letter = fallingPiece.matrix[r][c];
        if (!letter) continue;
        const boardRow = fallingPiece.row + r;
        const boardCol = fallingPiece.col + c;
        if (boardRow < 0 || boardRow >= BOARD_HEIGHT) continue;
        fallingMap.set(cellKey(boardRow, boardCol), letter);
      }
    }
  }

  const selectedKeys = new Set(selection.map((c) => cellKey(c.row, c.col)));
  const flashKeys = new Set((flashCells?.cells ?? []).map((c) => cellKey(c.row, c.col)));

  function cellFromPoint(clientX: number, clientY: number): GridCell | null {
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const cellEl = el?.closest("[data-row]") as HTMLElement | null;
    if (!cellEl) return null;
    const row = Number(cellEl.dataset.row);
    const col = Number(cellEl.dataset.col);
    if (Number.isNaN(row) || Number.isNaN(col)) return null;
    return { row, col };
  }

  function handlePointerDown(e: React.PointerEvent, cell: GridCell) {
    if (board[cell.row][cell.col] === null) return; // solo se puede empezar sobre una letra ya encastrada
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startRef.current = cell;
    setSelection([cell]);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!startRef.current) return;
    const current = cellFromPoint(e.clientX, e.clientY);
    if (!current) return;
    if (board[current.row][current.col] === null) return; // solo se puede pasar por letras encastradas

    setSelection((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last.row === current.row && last.col === current.col) return prev;

      // Si el dedo vuelve a la celda anterior del camino, deshace el último paso.
      if (prev.length >= 2) {
        const secondLast = prev[prev.length - 2];
        if (secondLast.row === current.row && secondLast.col === current.col) {
          return prev.slice(0, -1);
        }
      }

      const alreadyInPath = prev.some((c) => c.row === current.row && c.col === current.col);
      if (alreadyInPath) return prev;
      if (!areAdjacent(last, current)) return prev;

      return [...prev, current];
    });
  }

  function handlePointerUp() {
    if (!startRef.current) return;
    onSelectionEnd(selection);
    startRef.current = null;
    setSelection([]);
  }

  return (
    <Box
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
        gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`,
        gap: "2px",
        width: "100%",
        aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}`,
        touchAction: "none",
        userSelect: "none",
      }}
    >
      {board.map((rowArr, r) =>
        rowArr.map((letter, c) => {
          const key = cellKey(r, c);
          const fallingLetter = fallingMap.get(key);
          const isFalling = Boolean(fallingLetter) && !letter;
          const isSelected = selectedKeys.has(key);
          const isFlashSuccess = flashKeys.has(key) && flashCells?.kind === "success";
          const isFlashError = flashKeys.has(key) && flashCells?.kind === "error";
          const displayLetter = letter ?? fallingLetter ?? "";

          let backgroundColor: string = CELL_EMPTY_BG;
          let color: string = CELL_EMPTY_TEXT;
          if (isFlashSuccess) {
            backgroundColor = CELL_SUCCESS_BG;
            color = "#fff";
          } else if (isFlashError) {
            backgroundColor = CELL_ERROR_BG;
            color = "#fff";
          } else if (isSelected) {
            backgroundColor = CELL_SELECTED_BG;
            color = CELL_SELECTED_TEXT;
          } else if (isFalling && fallingPiece) {
            backgroundColor = PIECE_COLORS[fallingPiece.type];
            color = "#fff";
          } else if (letter) {
            backgroundColor = CELL_LOCKED_BG;
          }

          return (
            <Box
              key={key}
              data-row={r}
              data-col={c}
              onPointerDown={(e) => handlePointerDown(e, { row: r, col: c })}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "3px",
                fontWeight: 800,
                fontSize: { xs: 17, sm: 19 },
                fontFamily: "monospace",
                backgroundColor,
                color,
                border: letter ? "1px solid #ddd" : "none",
                transition: "background-color 0.12s, color 0.12s",
                cursor: letter ? "pointer" : "default",
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
