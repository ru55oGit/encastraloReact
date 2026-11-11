import { useCallback, useReducer } from "react";
import { clearCells, createEmptyColorGrid, createEmptyGrid, fitsAnywhere, place } from "../game/board";
import { TRAY_SIZE } from "../game/constants";
import { createRandomPiece, rotatePiece } from "../game/pieces";
import { ColorGrid, GameAction, GameState, Grid, GridPos, Path, Piece, Variant, VariantEngine } from "../game/types";
import { getBest, setBest } from "../utils/storage";

function freshTray(engine: VariantEngine): (Piece | null)[] {
  return Array.from({ length: TRAY_SIZE }, () => createRandomPiece(engine.randomValue));
}

// Lo mínimo para retomar una partida en curso (ver utils/inProgressGameState.ts)
// — useGame no necesita saber nada de foundWords/numberFloor/fruitFloor,
// eso vive aparte en game.tsx.
export interface ResumeSnapshot {
  grid: Grid;
  colorGrid: ColorGrid;
  tray: (Piece | null)[];
  score: number;
}

function initGameState(variant: Variant, engine: VariantEngine, resumeFrom?: ResumeSnapshot): GameState {
  if (resumeFrom) {
    return {
      variant,
      grid: resumeFrom.grid,
      colorGrid: resumeFrom.colorGrid,
      tray: resumeFrom.tray,
      score: resumeFrom.score,
      best: getBest(variant),
      phase: "playing",
    };
  }
  return {
    variant,
    grid: createEmptyGrid(),
    colorGrid: createEmptyColorGrid(),
    tray: freshTray(engine),
    score: 0,
    best: getBest(variant),
    phase: "playing",
  };
}

// Se corre después de cualquier movimiento que cambia el tablero (poner
// una pieza, o borrar un camino): guarda récord si corresponde, rellena la
// bandeja si las 3 piezas ya se usaron, y decide si el juego terminó.
function finishMove(state: GameState, engine: VariantEngine): GameState {
  let tray = state.tray;
  if (tray.every((piece) => piece === null)) {
    tray = freshTray(engine);
  }

  let best = state.best;
  if (state.score > best) {
    best = state.score;
    setBest(state.variant, best);
  }

  const noPieceFits = tray.every((piece) => piece === null || !fitsAnywhere(state.grid, piece));
  const noPathExists = !engine.anyClearPathExists(state.grid);
  const phase = noPieceFits && noPathExists ? "gameover" : "playing";

  return { ...state, tray, best, phase };
}

function reducer(state: GameState, action: GameAction, engine: VariantEngine): GameState {
  switch (action.type) {
    case "PLACE_PIECE": {
      if (state.phase !== "playing") return state;
      const piece = state.tray[action.trayIndex];
      if (!piece) return state;
      const { grid, colorGrid } = place(state.grid, state.colorGrid, piece, action.at);
      const tray = [...state.tray];
      tray[action.trayIndex] = null;
      const score = state.score + piece.cells.length;
      return finishMove({ ...state, grid, colorGrid, tray, score }, engine);
    }

    case "ROTATE_PIECE": {
      if (state.phase !== "playing") return state;
      const piece = state.tray[action.trayIndex];
      if (!piece) return state;
      const tray = [...state.tray];
      tray[action.trayIndex] = rotatePiece(piece);
      return { ...state, tray };
    }

    case "CLEAR_PATH": {
      if (state.phase !== "playing") return state;
      const { grid, colorGrid } = clearCells(state.grid, state.colorGrid, action.path);
      const score = state.score + action.points;
      return finishMove({ ...state, grid, colorGrid, score }, engine);
    }

    case "RESTART":
      return initGameState(state.variant, engine);

    default:
      return state;
  }
}

// `engine` ya resuelto por el caller (ver resolveVariantEngine en
// game/variants/index.ts) — este hook no sabe ni le importa si palabras
// cargó su diccionario vía import() dinámico, solo lo usa. `resumeFrom`
// (si viene) solo se usa para el estado INICIAL — un RESTART posterior
// siempre arranca una partida 100% nueva, nunca vuelve a resumir.
export function useGame(variant: Variant, engine: VariantEngine, resumeFrom?: ResumeSnapshot) {
  const [state, dispatch] = useReducer(
    (s: GameState, action: GameAction) => reducer(s, action, engine),
    variant,
    (v) => initGameState(v, engine, resumeFrom),
  );

  const placePiece = useCallback((trayIndex: number, at: GridPos) => {
    dispatch({ type: "PLACE_PIECE", trayIndex, at });
  }, []);

  const rotateTrayPiece = useCallback((trayIndex: number) => {
    dispatch({ type: "ROTATE_PIECE", trayIndex });
  }, []);

  const clearPath = useCallback((path: Path, points: number) => {
    dispatch({ type: "CLEAR_PATH", path, points });
  }, []);

  const restart = useCallback(() => {
    dispatch({ type: "RESTART" });
  }, []);

  return { state, placePiece, rotateTrayPiece, clearPath, restart };
}
