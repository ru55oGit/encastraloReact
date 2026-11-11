import { RefObject, useCallback, useRef, useState } from "react";
import { canPlace } from "../game/board";
import { DRAG_LIFT_PX, GRID_SIZE } from "../game/constants";
import { pieceDims } from "../game/pieces";
import { Grid, GridPos, Piece } from "../game/types";
import { BoardMetrics, getBoardMetrics } from "../utils/boardMetrics";

// Si el puntero no se movió más que esto desde el pointerdown, se
// interpreta como un toque (rotar), no un arrastre.
const MOVE_THRESHOLD_PX = 8;

export interface DragVisual {
  piece: Piece;
  left: number;
  top: number;
  cellSize: number;
}

export interface GhostState {
  cells: GridPos[];
  valid: boolean;
}

interface DragRefState {
  index: number;
  piece: Piece;
  metrics: BoardMetrics;
  lift: number;
  startX: number;
  startY: number;
  moved: boolean;
  target: GridPos | null;
}

interface UsePieceDragArgs {
  boardRef: RefObject<HTMLElement>;
  grid: Grid;
  onRotate: (trayIndex: number) => void;
  onPlace: (trayIndex: number, at: GridPos) => void;
}

export function usePieceDrag({ boardRef, grid, onRotate, onPlace }: UsePieceDragArgs) {
  const [drag, setDrag] = useState<DragVisual | null>(null);
  const [ghost, setGhost] = useState<GhostState | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // Espejo síncrono del drag en curso: los listeners van en `window` y
  // viven más que cualquier closure de un render particular.
  const dragRef = useRef<DragRefState | null>(null);
  const gridRef = useRef(grid);
  gridRef.current = grid;

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;

    if (!d.moved) {
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < MOVE_THRESHOLD_PX) return;
      d.moved = true;
    }

    const { width, height } = pieceDims(d.piece);
    const pieceWidthPx = width * d.metrics.pitch;
    const pieceHeightPx = height * d.metrics.pitch;
    const left = e.clientX - pieceWidthPx / 2;
    const top = e.clientY - pieceHeightPx - d.lift;
    const col = Math.round((left - d.metrics.x0) / d.metrics.pitch);
    const row = Math.round((top - d.metrics.y0) / d.metrics.pitch);

    setDrag({ piece: d.piece, left, top, cellSize: d.metrics.cellSize });

    const touchesBoard = d.piece.cells.some(({ r, c }) => {
      const gr = row + r;
      const gc = col + c;
      return gr >= 0 && gr < GRID_SIZE && gc >= 0 && gc < GRID_SIZE;
    });

    if (!touchesBoard) {
      d.target = null;
      setGhost(null);
      return;
    }

    const valid = canPlace(gridRef.current, d.piece, { r: row, c: col });
    d.target = valid ? { r: row, c: col } : null;
    setGhost({ cells: d.piece.cells.map(({ r, c }) => ({ r: row + r, c: col + c })), valid });
  }, []);

  const handlePointerUp = useCallback(() => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerUp);

    const d = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    setGhost(null);
    setDraggingIndex(null);
    if (!d) return;

    if (!d.moved) {
      onRotate(d.index);
      return;
    }
    if (d.target) onPlace(d.index, d.target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handlePointerMove, onPlace, onRotate]);

  const startDrag = useCallback(
    (e: React.PointerEvent, index: number, piece: Piece) => {
      e.preventDefault();
      const boardEl = boardRef.current;
      if (!boardEl) return;
      const metrics = getBoardMetrics(boardEl);
      if (!metrics) return;

      dragRef.current = {
        index,
        piece,
        metrics,
        lift: e.pointerType === "mouse" ? DRAG_LIFT_PX.mouse : DRAG_LIFT_PX.touch,
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
        target: null,
      };
      setDraggingIndex(index);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    },
    [boardRef, handlePointerMove, handlePointerUp],
  );

  return { drag, ghost, draggingIndex, isDragging: draggingIndex !== null, startDrag };
}
