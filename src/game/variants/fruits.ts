import { DIRECTIONS_8, FRUIT_EMOJI, GRID_SIZE, HINTS, MIN_PATH_LENGTH_FRUITS } from "../constants";
import { Grid, Path, PathEvaluation, PathResult, VariantEngine } from "../types";

export function randFruit(): string {
  return FRUIT_EMOJI[Math.floor(Math.random() * FRUIT_EMOJI.length)];
}

function sameFruitAsStart(grid: Grid, path: Path): boolean {
  if (path.length === 0) return true;
  const first = grid[path[0].r][path[0].c];
  return path.every(({ r, c }) => grid[r][c] === first);
}

function scoreForPath(length: number): number {
  return length * 10 + (length - MIN_PATH_LENGTH_FRUITS) * 5;
}

// ¿Existe algún grupo de frutas IGUALES contiguas (8 direcciones) de al
// menos `minSize`? No importa el orden del recorrido acá — es el tamaño
// de la región conexa de un mismo valor, así que un flood-fill (BFS/DFS)
// por cada celda no visitada alcanza (no hace falta backtracking de
// "visited" por rama). Una región de tamaño S siempre contiene un camino
// simple de cualquier largo de 1 a S, así que "existe una región de
// tamaño >= minSize" es exactamente lo mismo que "existe un camino
// seleccionable de largo minSize".
function anyRegionAtLeast(grid: Grid, minSize: number): boolean {
  const visited = new Set<number>();

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const value = grid[r][c];
      if (value === null) continue;
      const startKey = r * GRID_SIZE + c;
      if (visited.has(startKey)) continue;

      const stack = [{ r, c }];
      visited.add(startKey);
      let regionSize = 0;

      while (stack.length > 0) {
        const cell = stack.pop()!;
        regionSize++;
        for (const { r: dr, c: dc } of DIRECTIONS_8) {
          const nr = cell.r + dr;
          const nc = cell.c + dc;
          if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;
          const key = nr * GRID_SIZE + nc;
          if (visited.has(key) || grid[nr][nc] !== value) continue;
          visited.add(key);
          stack.push({ r: nr, c: nc });
        }
      }

      if (regionSize >= minSize) return true;
    }
  }
  return false;
}

function evaluateLivePath(grid: Grid, path: Path): PathEvaluation {
  const valid = sameFruitAsStart(grid, path) && path.length >= MIN_PATH_LENGTH_FRUITS;
  return { liveLabel: `${path.length}`, status: valid ? "ok" : "neutral" };
}

function resolvePath(grid: Grid, path: Path): PathResult {
  const allSame = sameFruitAsStart(grid, path);
  const valid = allSame && path.length >= MIN_PATH_LENGTH_FRUITS;
  if (!valid) {
    return {
      valid: false,
      points: 0,
      reasonIfInvalid: allSame
        ? `Necesitás al menos <b>${MIN_PATH_LENGTH_FRUITS}</b> frutas iguales`
        : "Tienen que ser todas la misma fruta",
    };
  }
  return { valid: true, points: scoreForPath(path.length), successLabel: String(path.length) };
}

// A diferencia de números (ventana deslizante), acá cualquier cantidad de
// frutas iguales conectadas (>= MIN_PATH_LENGTH_FRUITS) se puede borrar en
// cualquier momento — mismo criterio que palabras: las metas (ver
// FRUIT_GOAL_THRESHOLDS en game.tsx) son "al menos N", no un candado sobre
// la mecánica. Si tu primer grupo ya tiene 6 frutas, cumplís de una las
// metas de 4, 5 y 6.
export function anyMatchPath(grid: Grid): boolean {
  return anyRegionAtLeast(grid, MIN_PATH_LENGTH_FRUITS);
}

export const fruitsVariant: VariantEngine = {
  id: "fruits",
  hint: HINTS.fruits,
  minPathLength: MIN_PATH_LENGTH_FRUITS,
  randomValue: randFruit,
  cellLabel: (value) => value as string,
  evaluateLivePath,
  resolvePath,
  anyClearPathExists: anyMatchPath,
};
