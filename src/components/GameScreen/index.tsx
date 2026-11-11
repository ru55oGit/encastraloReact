import { useCallback, useRef, useState } from "react";
import { useGame } from "../../hooks/useGame";
import { usePieceDrag } from "../../hooks/usePieceDrag";
import { usePathSelection } from "../../hooks/usePathSelection";
import { Path, Variant } from "../../game/types";
import Header from "../Header";
import ModeToggle from "../ModeToggle";
import Board from "../Board";
import Tray from "../Tray";
import DragLayer from "../DragLayer";
import PathBadge from "../PathBadge";
import Toast from "../Toast";
import GameOverModal from "../GameOverModal";
import FloatingText, { FloatingTextItem } from "../FloatingText";
import styles from "./GameScreen.module.css";

const CLEAR_ANIMATION_MS = 350;
const TOAST_DURATION_MS = 3000;
const FLOAT_TEXT_DURATION_MS = 1000;

let nextFloatId = 0;

export default function GameScreen() {
  const { state, engine, placePiece, rotateTrayPiece, clearPath, setVariant, restart } = useGame("numbers");
  const boardRef = useRef<HTMLDivElement>(null);

  const [clearingCells, setClearingCells] = useState<Path | null>(null);
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
  }, []);

  const spawnFloatingText = useCallback((text: string, x: number, y: number) => {
    const id = nextFloatId++;
    setFloatingTexts((prev) => [...prev, { id, text, x, y }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, FLOAT_TEXT_DURATION_MS);
  }, []);

  const handlePathResolved = useCallback(
    (path: Path, valid: boolean, points: number, reason?: string) => {
      if (!valid) {
        showToast(reason ?? "");
        return;
      }

      const cellEls = path.map(({ r, c }) => boardRef.current?.querySelector<HTMLElement>(`[data-row="${r}"][data-col="${c}"]`));
      const rects = cellEls.filter((el): el is HTMLElement => !!el).map((el) => el.getBoundingClientRect());
      const cx = rects.reduce((sum, rect) => sum + rect.left + rect.width / 2, 0) / (rects.length || 1);
      const cy = rects.reduce((sum, rect) => sum + rect.top + rect.height / 2, 0) / (rects.length || 1);

      // evaluateLivePath ya sabe armar el label (suma/palabra) a partir del
      // path+grid — lo reusamos acá para el "+N" en vez de duplicar lógica.
      const liveLabel = engine.evaluateLivePath(state.grid, path).liveLabel;
      const label = engine.id === "words" ? `+${points} ${liveLabel}` : `+${points}`;
      spawnFloatingText(label, cx, cy);

      setClearingCells(path);
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = setTimeout(() => {
        setClearingCells(null);
        clearPath(path, points);
      }, CLEAR_ANIMATION_MS);
    },
    [clearPath, engine, showToast, spawnFloatingText, state.grid],
  );

  const pieceDrag = usePieceDrag({
    boardRef,
    grid: state.grid,
    onRotate: rotateTrayPiece,
    onPlace: placePiece,
  });

  const pathSelection = usePathSelection({
    boardRef,
    grid: state.grid,
    engine,
    isDraggingPiece: pieceDrag.isDragging,
    onResolved: handlePathResolved,
  });

  const handleSetVariant = useCallback(
    (variant: Variant) => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
      setToastMessage(null);
      setClearingCells(null);
      setFloatingTexts([]);
      setVariant(variant);
    },
    [setVariant],
  );

  return (
    <div className={styles.screen}>
      <Header score={state.score} best={state.best} />
      <ModeToggle variant={state.variant} onChange={handleSetVariant} />
      <p className={styles.hint} dangerouslySetInnerHTML={{ __html: engine.hint }} />

      <Board
        boardRef={boardRef}
        grid={state.grid}
        colorGrid={state.colorGrid}
        engine={engine}
        path={pathSelection.path}
        ghostCells={pieceDrag.ghost}
        clearingCells={clearingCells}
        onPointerDown={pathSelection.handlePointerDown}
      />

      <Tray
        tray={state.tray}
        grid={state.grid}
        engine={engine}
        draggingIndex={pieceDrag.draggingIndex}
        onPieceDown={pieceDrag.startDrag}
      />

      <div className={styles.row}>
        <button type="button" className={styles.ghostbtn} onClick={restart}>
          Reiniciar
        </button>
      </div>

      <DragLayer drag={pieceDrag.drag} engine={engine} />
      <PathBadge badge={pathSelection.badge} />
      <Toast message={toastMessage} />
      <FloatingText items={floatingTexts} />
      <GameOverModal open={state.phase === "gameover"} variant={state.variant} score={state.score} onRestart={restart} />
    </div>
  );
}
