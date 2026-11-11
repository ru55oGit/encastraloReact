import { useCallback, useReducer } from "react";
import { clearCells, createEmptyColorGrid, createEmptyGrid, fitsAnywhere, place } from "../game/board";
import { TRAY_SIZE } from "../game/constants";
import { createRandomPiece, rotatePiece } from "../game/pieces";
import { GameAction, GameState, GridPos, Path, Piece, Variant } from "../game/types";
import { getVariantEngine } from "../game/variants";
import { getBest, setBest } from "../utils/storage";

function freshTray(variant: Variant): (Piece | null)[] {
  const engine = getVariantEngine(variant);
  return Array.from({ length: TRAY_SIZE }, () => createRandomPiece(engine.randomValue));
}

function initGameState(variant: Variant): GameState {
  return {
    variant,
    grid: createEmptyGrid(),
    colorGrid: createEmptyColorGrid(),
    tray: freshTray(variant),
    score: 0,
    best: getBest(variant),
    phase: "playing",
  };
}

// Se corre después de cualquier movimiento que cambia el tablero (poner
// una pieza, o borrar un camino): guarda récord si corresponde, rellena la
// bandeja si las 3 piezas ya se usaron, y decide si el juego terminó.
function finishMove(state: GameState): GameState {
  let tray = state.tray;
  if (tray.every((piece) => piece === null)) {
    tray = freshTray(state.variant);
  }

  let best = state.best;
  if (state.score > best) {
    best = state.score;
    setBest(state.variant, best);
  }

  const engine = getVariantEngine(state.variant);
  const noPieceFits = tray.every((piece) => piece === null || !fitsAnywhere(state.grid, piece));
  const noPathExists = !engine.anyClearPathExists(state.grid);
  const phase = noPieceFits && noPathExists ? "gameover" : "playing";

  return { ...state, tray, best, phase };
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "PLACE_PIECE": {
      if (state.phase !== "playing") return state;
      const piece = state.tray[action.trayIndex];
      if (!piece) return state;
      const { grid, colorGrid } = place(state.grid, state.colorGrid, piece, action.at);
      const tray = [...state.tray];
      tray[action.trayIndex] = null;
      const score = state.score + piece.cells.length;
      return finishMove({ ...state, grid, colorGrid, tray, score });
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
      return finishMove({ ...state, grid, colorGrid, score });
    }

    case "SET_VARIANT":
      return initGameState(action.variant);

    case "RESTART":
      return initGameState(state.variant);

    default:
      return state;
  }
}

export function useGame(initialVariant: Variant) {
  const [state, dispatch] = useReducer(reducer, initialVariant, initGameState);

  const placePiece = useCallback((trayIndex: number, at: GridPos) => {
    dispatch({ type: "PLACE_PIECE", trayIndex, at });
  }, []);

  const rotateTrayPiece = useCallback((trayIndex: number) => {
    dispatch({ type: "ROTATE_PIECE", trayIndex });
  }, []);

  const clearPath = useCallback((path: Path, points: number) => {
    dispatch({ type: "CLEAR_PATH", path, points });
  }, []);

  const setVariant = useCallback((variant: Variant) => {
    dispatch({ type: "SET_VARIANT", variant });
  }, []);

  const restart = useCallback(() => {
    dispatch({ type: "RESTART" });
  }, []);

  return {
    state,
    engine: getVariantEngine(state.variant),
    placePiece,
    rotateTrayPiece,
    clearPath,
    setVariant,
    restart,
  };
}
