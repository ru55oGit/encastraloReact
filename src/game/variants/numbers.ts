import { DIRECTIONS_8, GRID_SIZE, HINTS, KEYCAP_EMOJI, MIN_PATH_LENGTH_NUMBERS, NUMBER_WEIGHTS, TARGET_SUM } from "../constants";
import { Grid, Path, PathEvaluation, PathResult, VariantEngine } from "../types";

// Ponderado a favor de los números bajos (ver NUMBER_WEIGHTS) para que
// sea viable armar sumas de 10 seguido.
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

function evaluateLivePath(grid: Grid, path: Path): PathEvaluation {
  const sum = pathSum(grid, path);
  return {
    liveLabel: `Σ ${sum}`,
    status: sum === TARGET_SUM ? "ok" : sum > TARGET_SUM ? "over" : "neutral",
  };
}

function scoreForPath(length: number): number {
  return length * 10 + (length - MIN_PATH_LENGTH_NUMBERS) * 5;
}

function resolvePath(grid: Grid, path: Path): PathResult {
  const sum = pathSum(grid, path);
  const valid = sum === TARGET_SUM && path.length >= MIN_PATH_LENGTH_NUMBERS;
  if (!valid) {
    return { valid: false, points: 0, reasonIfInvalid: `Sumaste <b>${sum}</b>. ¡Tienen que sumar <b>${TARGET_SUM}</b>!` };
  }
  return { valid: true, points: scoreForPath(path.length) };
}

// ¿Existe algún recorrido de casillas contiguas (8 direcciones) que sume
// exactamente 10? DFS con poda: como todos los valores son >=1, en cuanto
// la suma parcial pasa el objetivo ese camino ya no puede servir.
export function anyPathOf10(grid: Grid): boolean {
  const seen = new Set<number>();

  function dfs(r: number, c: number, sum: number, length: number): boolean {
    if (sum === TARGET_SUM) return length >= MIN_PATH_LENGTH_NUMBERS;
    for (const { r: dr, c: dc } of DIRECTIONS_8) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;
      const value = grid[nr][nc];
      if (value === null) continue;
      const key = nr * GRID_SIZE + nc;
      if (seen.has(key)) continue;
      const nextSum = sum + (value as number);
      if (nextSum > TARGET_SUM) continue;
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

export const numbersVariant: VariantEngine = {
  id: "numbers",
  hint: HINTS.numbers,
  minPathLength: MIN_PATH_LENGTH_NUMBERS,
  randomValue: randDigit,
  cellLabel: (value) => KEYCAP_EMOJI[value as number] ?? "",
  evaluateLivePath,
  resolvePath,
  anyClearPathExists: anyPathOf10,
};
