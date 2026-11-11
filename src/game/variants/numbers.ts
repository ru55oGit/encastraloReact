import { DIRECTIONS_8, GRID_SIZE, HINTS, KEYCAP_EMOJI, MAX_TARGET_SUM, MIN_PATH_LENGTH_NUMBERS, MIN_TARGET_SUM, NUMBER_WEIGHTS } from "../constants";
import { Grid, Path, PathEvaluation, PathResult, VariantEngine } from "../types";

// Ponderado a favor de los números bajos (ver NUMBER_WEIGHTS) para que
// sea viable armar sumas dentro del rango válido seguido.
export function randDigit(): number {
  const total = NUMBER_WEIGHTS.reduce((sum, weight) => sum + weight, 0);
  let x = Math.random() * total;
  for (let digit = 1; digit <= 9; digit++) {
    x -= NUMBER_WEIGHTS[digit];
    if (x < 0) return digit;
  }
  return 1;
}

export function pathSum(grid: Grid, path: Path): number {
  return path.reduce((sum, { r, c }) => sum + (grid[r][c] as number), 0);
}

function scoreForPath(length: number): number {
  return length * 10 + (length - MIN_PATH_LENGTH_NUMBERS) * 5;
}

// DFS compartido por las dos variantes de validación (rango libre [10,20]
// y set exacto de sumas permitidas): corta en cuanto `isTerminal` se
// cumple, y poda con `prune` para no explorar de más (todos los valores
// son >=1, así que una suma parcial nunca vuelve a bajar).
function anyPathMatching(grid: Grid, isTerminal: (sum: number) => boolean, prune: (sum: number) => boolean): boolean {
  const seen = new Set<number>();

  function dfs(r: number, c: number, sum: number, length: number): boolean {
    if (isTerminal(sum)) return length >= MIN_PATH_LENGTH_NUMBERS;
    if (prune(sum)) return false;
    for (const { r: dr, c: dc } of DIRECTIONS_8) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;
      const value = grid[nr][nc];
      if (value === null) continue;
      const key = nr * GRID_SIZE + nc;
      if (seen.has(key)) continue;
      const nextSum = sum + (value as number);
      if (prune(nextSum)) continue;
      seen.add(key);
      const found = dfs(nr, nc, nextSum, length + 1);
      seen.delete(key);
      if (found) return true;
    }
    return false;
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const value = grid[r][c];
      if (value === null) continue;
      const key = r * GRID_SIZE + c;
      seen.add(key);
      const found = dfs(r, c, value as number, 1);
      seen.delete(key);
      if (found) return true;
    }
  }
  return false;
}

function isValidSum(sum: number): boolean {
  return sum >= MIN_TARGET_SUM && sum <= MAX_TARGET_SUM;
}

function evaluateLivePath(grid: Grid, path: Path): PathEvaluation {
  const sum = pathSum(grid, path);
  return {
    liveLabel: `Σ ${sum}`,
    status: isValidSum(sum) ? "ok" : sum > MAX_TARGET_SUM ? "over" : "neutral",
  };
}

function resolvePath(grid: Grid, path: Path): PathResult {
  const sum = pathSum(grid, path);
  const valid = isValidSum(sum) && path.length >= MIN_PATH_LENGTH_NUMBERS;
  if (!valid) {
    return {
      valid: false,
      points: 0,
      reasonIfInvalid: `Sumaste <b>${sum}</b>. ¡Tiene que dar entre <b>${MIN_TARGET_SUM}</b> y <b>${MAX_TARGET_SUM}</b>!`,
    };
  }
  return { valid: true, points: scoreForPath(path.length), successLabel: String(sum) };
}

// ¿Existe algún recorrido de casillas contiguas (8 direcciones) que sume
// algo dentro de [MIN_TARGET_SUM, MAX_TARGET_SUM]?
export function anyValidSumPath(grid: Grid): boolean {
  return anyPathMatching(grid, isValidSum, (sum) => sum > MAX_TARGET_SUM);
}

export const numbersVariant: VariantEngine = {
  id: "numbers",
  hint: HINTS.numbers,
  minPathLength: MIN_PATH_LENGTH_NUMBERS,
  randomValue: randDigit,
  cellLabel: (value) => KEYCAP_EMOJI[value as number] ?? "",
  evaluateLivePath,
  resolvePath,
  anyClearPathExists: anyValidSumPath,
};

// Ventana deslizante: solo deja borrar con una suma que esté en
// `allowedSums` (el "piso" actual y, si no llegó al techo, piso+1) — ni
// más ni menos, ni cualquier otra del rango general. Se reconstruye en
// game.tsx cada vez que el piso avanza (ver numberFloor ahí). El corte de
// "ya te pasaste" usa el máximo de ESTA ventana puntual, no el techo
// global del juego — si la ventana es {11,12}, sumar 15 ya es "over",
// aunque 15 por sí solo esté lejos del techo real (25).
export function withAllowedSums(allowedSums: number[]): VariantEngine {
  const allowed = new Set(allowedSums);
  const windowMax = Math.max(...allowed);

  function isAllowed(sum: number): boolean {
    return allowed.has(sum);
  }

  function evaluateLivePathLocked(grid: Grid, path: Path): PathEvaluation {
    const sum = pathSum(grid, path);
    return {
      liveLabel: `Σ ${sum}`,
      status: isAllowed(sum) ? "ok" : sum > windowMax ? "over" : "neutral",
    };
  }

  function resolvePathLocked(grid: Grid, path: Path): PathResult {
    const sum = pathSum(grid, path);
    const valid = isAllowed(sum) && path.length >= MIN_PATH_LENGTH_NUMBERS;
    if (!valid) {
      const allowedList = [...allowed].sort((a, b) => a - b).join(" o ");
      return {
        valid: false,
        points: 0,
        reasonIfInvalid: `Sumaste <b>${sum}</b>. ¡Tiene que dar <b>${allowedList}</b>!`,
      };
    }
    return { valid: true, points: scoreForPath(path.length), successLabel: String(sum) };
  }

  function anyAllowedSumPath(grid: Grid): boolean {
    return anyPathMatching(grid, isAllowed, (sum) => sum > windowMax);
  }

  return {
    id: "numbers",
    hint: HINTS.numbers,
    minPathLength: MIN_PATH_LENGTH_NUMBERS,
    randomValue: randDigit,
    cellLabel: (value) => KEYCAP_EMOJI[value as number] ?? "",
    evaluateLivePath: evaluateLivePathLocked,
    resolvePath: resolvePathLocked,
    anyClearPathExists: anyAllowedSumPath,
  };
}
