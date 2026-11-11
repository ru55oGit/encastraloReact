import { isAdjacent8 } from "./board";
import { Grid, GridPos, Path } from "./types";

// Decide el PRÓXIMO camino cuando el puntero entra a `candidate`, dado el
// camino actual. Pura y sin DOM — usePathSelection solo le pasa la celda
// ya resuelta (cellAt con zona estricta) en cada pointermove.
//
// Reglas (mismo criterio que el POC):
//   - Volver a la celda anterior = deshacer el último paso (backtrack).
//   - Si no, se agrega solo si: hay un valor ahí, es vecina en 8
//     direcciones de la última celda del camino, y no está ya en el camino.
export function stepPath(path: Path, candidate: GridPos, grid: Grid): Path {
  if (path.length === 0) return path;

  const last = path[path.length - 1];
  const prev = path.length >= 2 ? path[path.length - 2] : null;

  if (prev && prev.r === candidate.r && prev.c === candidate.c) {
    return path.slice(0, -1);
  }

  const value = grid[candidate.r][candidate.c];
  const alreadyInPath = path.some((p) => p.r === candidate.r && p.c === candidate.c);

  if (value !== null && isAdjacent8(last, candidate) && !alreadyInPath) {
    return [...path, candidate];
  }

  return path;
}
