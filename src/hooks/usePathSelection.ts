import { RefObject, useCallback, useRef, useState } from "react";
import { stepPath } from "../game/pathBuilder";
import { Grid, GridPos, Path, PathEvaluation, VariantEngine } from "../game/types";
import { BoardMetrics, cellAtPoint, getBoardMetrics } from "../utils/boardMetrics";

export interface BadgeState {
  x: number;
  y: number;
  evaluation: PathEvaluation;
}

interface UsePathSelectionArgs {
  boardRef: RefObject<HTMLElement>;
  grid: Grid;
  engine: VariantEngine;
  // Si hay un drag de pieza en curso, un pointerdown sobre el tablero no
  // tiene que arrancar también un camino.
  isDraggingPiece: boolean;
  onResolved: (path: Path, valid: boolean, points: number, reason?: string) => void;
}

export function usePathSelection({ boardRef, grid, engine, isDraggingPiece, onResolved }: UsePathSelectionArgs) {
  const [path, setPath] = useState<GridPos[] | null>(null);
  const [badge, setBadge] = useState<BadgeState | null>(null);

  // Espejos síncronos para los listeners de `window`, que no deben depender
  // de un closure de un render particular (mismo criterio que
  // usePieceDrag).
  const pathRef = useRef<GridPos[] | null>(null);
  const metricsRef = useRef<BoardMetrics | null>(null);
  const gridRef = useRef(grid);
  gridRef.current = grid;
  const engineRef = useRef(engine);
  engineRef.current = engine;

  const updateBadge = useCallback((currentPath: GridPos[], x: number, y: number) => {
    setBadge({ x, y, evaluation: engineRef.current.evaluateLivePath(gridRef.current, currentPath) });
  }, []);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const metrics = metricsRef.current;
      const currentPath = pathRef.current;
      if (!metrics || !currentPath) return;

      const hit = cellAtPoint(metrics, e.clientX, e.clientY, true);
      const nextPath = hit ? stepPath(currentPath, hit, gridRef.current) : currentPath;
      pathRef.current = nextPath;
      setPath(nextPath);
      updateBadge(nextPath, e.clientX, e.clientY);
    },
    [updateBadge],
  );

  const handlePointerUp = useCallback(() => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerUp);

    const finalPath = pathRef.current;
    pathRef.current = null;
    metricsRef.current = null;
    setPath(null);
    setBadge(null);
    if (!finalPath) return;

    const result = engineRef.current.resolvePath(gridRef.current, finalPath);
    onResolved(finalPath, result.valid, result.points, result.reasonIfInvalid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handlePointerMove, onResolved]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isDraggingPiece) return;
      const boardEl = boardRef.current;
      if (!boardEl) return;
      const metrics = getBoardMetrics(boardEl);
      if (!metrics) return;

      const hit = cellAtPoint(metrics, e.clientX, e.clientY, false);
      if (!hit || gridRef.current[hit.r][hit.c] === null) return;

      e.preventDefault();
      metricsRef.current = metrics;
      pathRef.current = [hit];
      setPath([hit]);
      updateBadge([hit], e.clientX, e.clientY);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    },
    [boardRef, handlePointerMove, handlePointerUp, isDraggingPiece, updateBadge],
  );

  return { path, badge, handlePointerDown };
}
