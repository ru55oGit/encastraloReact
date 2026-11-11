import { GRID_SIZE, STRICT_ZONE_RATIO } from "../game/constants";
import { GridPos } from "../game/types";

export interface BoardMetrics {
  x0: number;
  y0: number;
  pitch: number; // distancia entre el origen de una celda y la siguiente (celda + gap)
  cellSize: number;
}

// Lee la posición real en pantalla de las dos primeras celdas para derivar
// el origen y el paso de la grilla — así no hay que duplicar en JS el
// cálculo de --cs/--gap que ya vive en CSS.
export function getBoardMetrics(boardEl: HTMLElement): BoardMetrics | null {
  const a = boardEl.querySelector<HTMLElement>('[data-row="0"][data-col="0"]');
  const b = boardEl.querySelector<HTMLElement>('[data-row="0"][data-col="1"]');
  if (!a || !b) return null;
  const rectA = a.getBoundingClientRect();
  const rectB = b.getBoundingClientRect();
  return { x0: rectA.left, y0: rectA.top, pitch: rectB.left - rectA.left, cellSize: rectA.width };
}

// strict=true exige que el punto esté en la zona central (±36% del centro)
// de la celda — evita tomarla por rozar una esquina desde la vecina.
export function cellAtPoint(metrics: BoardMetrics, x: number, y: number, strict: boolean): GridPos | null {
  const fx = (x - metrics.x0) / metrics.pitch;
  const fy = (y - metrics.y0) / metrics.pitch;
  const c = Math.floor(fx);
  const r = Math.floor(fy);
  if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return null;
  if (strict) {
    const dx = fx - c - 0.5;
    const dy = fy - r - 0.5;
    if (Math.abs(dx) > STRICT_ZONE_RATIO || Math.abs(dy) > STRICT_ZONE_RATIO) return null;
  }
  return { r, c };
}
