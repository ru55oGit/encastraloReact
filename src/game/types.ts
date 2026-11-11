export type Variant = "numbers" | "words";

export type ShapeName = "punto" | "I2" | "I3" | "L" | "T" | "U" | "Z";

// Dígito 1-9 en la variante números, letra (string de 1 char) en palabras.
export type CellValue = number | string;

export interface PieceCell {
  r: number;
  c: number;
  value: CellValue;
}

export interface Piece {
  id: string;
  shape: ShapeName;
  cells: PieceCell[]; // ya normalizado: min(r) === 0 && min(c) === 0
  color: string;
}

// grid[r][c] = valor de esa celda, o null si está vacía.
export type Grid = (CellValue | null)[][];
export type ColorGrid = (string | null)[][];

export interface GridPos {
  r: number;
  c: number;
}

// El ORDEN importa: en la variante palabras arma el string letra a letra
// en el orden en que se fue dibujando el camino.
export type Path = GridPos[];

export interface PathEvaluation {
  liveLabel: string; // "Σ 7" | "ENCA" — lo que muestra el badge en vivo
  status: "neutral" | "ok" | "over"; // "over" solo lo usa la variante números
}

export interface PathResult {
  valid: boolean;
  points: number; // 0 si no es válido
  reasonIfInvalid?: string; // texto del toast, ya en español rioplatense
  // Texto extra para el "+N" flotante (ej. la palabra formada) — opcional,
  // no todas las variantes lo necesitan (números solo muestra "+N" a secas).
  successLabel?: string;
}

// Todo lo que useGame/usePathSelection necesitan sin saber si están
// jugando números o palabras — ver variants/index.ts para el registro.
export interface VariantEngine {
  id: Variant;
  hint: string;
  minPathLength: number; // 2 (números) | 3 (palabras)
  randomValue(): CellValue;
  cellLabel(value: CellValue): string; // keycap emoji | la letra tal cual
  evaluateLivePath(grid: Grid, path: Path): PathEvaluation;
  resolvePath(grid: Grid, path: Path): PathResult;
  anyClearPathExists(grid: Grid): boolean;
}

export type Phase = "playing" | "gameover";

export interface GameState {
  variant: Variant;
  grid: Grid;
  colorGrid: ColorGrid;
  tray: (Piece | null)[];
  score: number;
  best: number;
  phase: Phase;
}

export type GameAction =
  | { type: "PLACE_PIECE"; trayIndex: number; at: GridPos }
  | { type: "ROTATE_PIECE"; trayIndex: number }
  | { type: "CLEAR_PATH"; path: Path; points: number }
  | { type: "SET_VARIANT"; variant: Variant }
  | { type: "RESTART" };
