import Box from "@mui/material/Box";
import { LETRIS_PALETTE, PIECE_COLORS } from "../../game/constants";
import { Variant } from "../../game/types";

const ACCENT = "#e74c3c";

// Snapshot estático (sin animación) de cómo se ve un tablero a mitad de
// partida en cada variante — reemplaza el emoji único de antes para que
// cada card de categoría muestre su propia mecánica a simple vista
// (pedido explícito: "letras, numeros y frutas", no un ícono genérico).
const COLS = 6;
const ROWS = 6;

interface PreviewCell {
  label: string;
  background: string;
  color: string;
}

function cellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

const MUTED_BG = `${ACCENT}1a`;
const MUTED_TEXT = `${ACCENT}99`;
const GREEN = "#22c55e";

function numbersCells(): Map<string, PreviewCell> {
  const cells = new Map<string, PreviewCell>();
  cells.set(cellKey(0, 1), { label: "3", background: MUTED_BG, color: MUTED_TEXT });
  cells.set(cellKey(1, 1), { label: "4", background: GREEN, color: "#fff" });
  cells.set(cellKey(1, 2), { label: "6", background: GREEN, color: "#fff" });
  cells.set(cellKey(2, 4), { label: "9", background: MUTED_BG, color: MUTED_TEXT });
  cells.set(cellKey(3, 0), { label: "7", background: PIECE_COLORS[0], color: "#fff" });
  cells.set(cellKey(3, 3), { label: "2", background: PIECE_COLORS[3], color: "#fff" });
  cells.set(cellKey(4, 2), { label: "5", background: PIECE_COLORS[5], color: "#fff" });
  cells.set(cellKey(5, 4), { label: "1", background: MUTED_BG, color: MUTED_TEXT });
  return cells;
}

function wordsCells(): Map<string, PreviewCell> {
  const cells = new Map<string, PreviewCell>();
  cells.set(cellKey(0, 4), { label: "K", background: MUTED_BG, color: MUTED_TEXT });
  cells.set(cellKey(1, 1), { label: "S", background: GREEN, color: "#fff" });
  cells.set(cellKey(1, 2), { label: "O", background: GREEN, color: "#fff" });
  cells.set(cellKey(1, 3), { label: "L", background: GREEN, color: "#fff" });
  cells.set(cellKey(2, 0), { label: "Q", background: MUTED_BG, color: MUTED_TEXT });
  cells.set(cellKey(3, 2), { label: "R", background: LETRIS_PALETTE.lockedBg, color: LETRIS_PALETTE.emptyText });
  cells.set(cellKey(3, 5), { label: "T", background: LETRIS_PALETTE.lockedBg, color: LETRIS_PALETTE.emptyText });
  cells.set(cellKey(4, 4), { label: "N", background: LETRIS_PALETTE.lockedBg, color: LETRIS_PALETTE.emptyText });
  cells.set(cellKey(5, 1), { label: "M", background: MUTED_BG, color: MUTED_TEXT });
  return cells;
}

function fruitsCells(): Map<string, PreviewCell> {
  const cells = new Map<string, PreviewCell>();
  cells.set(cellKey(0, 4), { label: "🍇", background: PIECE_COLORS[2], color: "#fff" });
  cells.set(cellKey(1, 1), { label: "🍎", background: GREEN, color: "#fff" });
  cells.set(cellKey(1, 2), { label: "🍎", background: GREEN, color: "#fff" });
  cells.set(cellKey(2, 2), { label: "🍎", background: GREEN, color: "#fff" });
  cells.set(cellKey(3, 0), { label: "🍊", background: PIECE_COLORS[4], color: "#fff" });
  cells.set(cellKey(4, 4), { label: "🍌", background: PIECE_COLORS[0], color: "#fff" });
  cells.set(cellKey(5, 2), { label: "🍓", background: PIECE_COLORS[5], color: "#fff" });
  return cells;
}

const BUILDERS: Record<Variant, () => Map<string, PreviewCell>> = {
  numbers: numbersCells,
  words: wordsCells,
  fruits: fruitsCells,
};

interface CategoryPreviewProps {
  variant: Variant;
}

export default function CategoryPreview({ variant }: CategoryPreviewProps) {
  const cells = BUILDERS[variant]();

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        gap: "2px",
        width: "100%",
        aspectRatio: `${COLS} / ${ROWS}`,
      }}
    >
      {Array.from({ length: ROWS }, (_, row) =>
        Array.from({ length: COLS }, (_, col) => {
          const cell = cells.get(cellKey(row, col));
          return (
            <Box
              key={cellKey(row, col)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "2px",
                fontWeight: 800,
                fontSize: { xs: 9, sm: 10 },
                fontFamily: "monospace",
                backgroundColor: cell?.background ?? "#f3f3f3",
                color: cell?.color ?? "transparent",
              }}
            >
              {cell?.label ?? ""}
            </Box>
          );
        }),
      )}
    </Box>
  );
}
