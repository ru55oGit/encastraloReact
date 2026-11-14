import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import { LETRIS_PALETTE, PIECE_COLORS } from "../../game/constants";

// Mismo patrón que letrisReact/viborealoReact (HowToPlayDemo/SnakeDemo): un
// ciclo guionado (no el motor real) a base de setTimeout encadenados, que se
// vuelve a programar solo al final. 8x8 para que coincida con la grilla real
// (cuadrada).
//
// Disposición espejada del preview del hub (GamePreviews de boludeando): una
// pieza en "U" violeta que entra y rodea una letra en blanco arriba, y abajo
// una palabra que se selecciona en verde + letras sueltas. Solo la variante
// "words" (el juego principal).
const DEMO_SIZE = 8;

interface DemoCellPos {
  row: number;
  col: number;
}

interface DemoCell {
  label: string;
  isFiller: boolean; // relleno decorativo, no forma parte de ninguna ronda
  isPiece?: boolean; // celda de una pieza ya asentada (se dibuja en violeta)
}

// La pieza en "U": 5 celdas (dos arriba en las puntas de abajo no, ojo) con el
// hueco en (0,1), donde queda rodeada la letra blanca. Offsets respecto del
// ancla (esquina sup-izq de su caja de 2x3):
//   V · V      (V = celda de la pieza; · = hueco con la letra blanca)
//   V V V
const U_OFFSETS: DemoCellPos[] = [
  { row: 0, col: 0 },
  { row: 0, col: 2 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
];
const SETTLE_ANCHOR: DemoCellPos = { row: 1, col: 3 };
// La letra en blanco que la U rodea queda en el hueco del ancla de asentado.
const LONE_LETTER_POS: DemoCellPos = { row: SETTLE_ANCHOR.row, col: SETTLE_ANCHOR.col + 1 };
// Camino de entrada de la pieza (arrastre en diagonal) hasta el asentado.
const SLIDE_ANCHORS: DemoCellPos[] = [
  { row: 0, col: 5 },
  { row: 0, col: 4 },
  SETTLE_ANCHOR,
];

// Ronda 1: palabra recta (SOL). Ronda 2: camino doblado (RIO) — misma
// mecánica, para mostrar que no hace falta una línea recta.
const ROUND_1: { pos: DemoCellPos; label: string }[] = [
  { pos: { row: 4, col: 2 }, label: "S" },
  { pos: { row: 4, col: 3 }, label: "O" },
  { pos: { row: 4, col: 4 }, label: "L" },
];
const ROUND_2: { pos: DemoCellPos; label: string }[] = [
  { pos: { row: 5, col: 5 }, label: "R" },
  { pos: { row: 6, col: 5 }, label: "I" },
  { pos: { row: 6, col: 4 }, label: "O" },
];

const FILLER_LETTERS = "ETANRC";
const FILLER_SPOTS: DemoCellPos[] = [
  { row: 4, col: 6 },
  { row: 5, col: 2 },
  { row: 6, col: 2 },
  { row: 7, col: 4 },
  { row: 7, col: 1 },
  { row: 3, col: 6 },
];

const SLIDE_STEP_MS = 180;
const LANDED_PAUSE_MS = 450;
const SELECT_STEP_MS = 180;
const FLASH_MS = 450;
const CLEAR_PAUSE_MS = 500;
const BETWEEN_ROUNDS_PAUSE_MS = 450;
const RESET_PAUSE_MS = 900;

function cellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

function randomLetter(): string {
  return FILLER_LETTERS[Math.floor(Math.random() * FILLER_LETTERS.length)];
}

function buildInitialBoard(): Map<string, DemoCell> {
  const board = new Map<string, DemoCell>();
  for (const { pos, label } of ROUND_1) board.set(cellKey(pos.row, pos.col), { label, isFiller: false });
  for (const { pos, label } of ROUND_2) board.set(cellKey(pos.row, pos.col), { label, isFiller: false });
  for (const pos of FILLER_SPOTS) board.set(cellKey(pos.row, pos.col), { label: randomLetter(), isFiller: true });
  // La letra en blanco que la U va a rodear ya está en el tablero.
  board.set(cellKey(LONE_LETTER_POS.row, LONE_LETTER_POS.col), { label: randomLetter(), isFiller: true });
  return board;
}

export default function HowToPlayDemo() {
  const [board, setBoard] = useState<Map<string, DemoCell>>(() => buildInitialBoard());
  const [pieceAnchor, setPieceAnchor] = useState<DemoCellPos | null>(null);
  const [pieceLetters, setPieceLetters] = useState<string[]>(() => U_OFFSETS.map(randomLetter));
  const [selectionPath, setSelectionPath] = useState<DemoCellPos[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [flashSuccess, setFlashSuccess] = useState(false);

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    function schedule(fn: () => void, delay: number) {
      const id = setTimeout(fn, delay);
      timeoutsRef.current.push(id);
    }

    // Anima la selección progresiva de `cells`, flashea en verde al formar la
    // palabra, y las borra. Devuelve cuánto delay total consumió.
    function scheduleSelectionRound(cells: DemoCellPos[], startDelay: number): number {
      let delay = startDelay;

      schedule(() => setSelectionPath(cells), delay);
      for (let i = 1; i <= cells.length; i++) {
        schedule(() => setSelectedCount(i), delay + SELECT_STEP_MS * i);
      }
      delay += SELECT_STEP_MS * cells.length;

      schedule(() => setFlashSuccess(true), delay + 150);
      delay += 150;

      schedule(() => {
        setFlashSuccess(false);
        setSelectedCount(0);
        setSelectionPath([]);
        setBoard((prev) => {
          const next = new Map(prev);
          for (const { row, col } of cells) next.delete(cellKey(row, col));
          return next;
        });
      }, delay + FLASH_MS);
      delay += FLASH_MS;

      return delay + CLEAR_PAUSE_MS;
    }

    function runCycle() {
      setBoard(buildInitialBoard());
      setSelectedCount(0);
      setSelectionPath([]);
      setFlashSuccess(false);
      setPieceAnchor(null);
      const letters = U_OFFSETS.map(randomLetter);
      setPieceLetters(letters);

      // La pieza en "U" entra deslizándose y se asienta rodeando la letra en
      // blanco que ya estaba en el tablero.
      let delay = SLIDE_STEP_MS;
      for (const step of SLIDE_ANCHORS) {
        schedule(() => setPieceAnchor(step), delay);
        delay += SLIDE_STEP_MS;
      }

      // Al asentarse, las 5 celdas de la U pasan a ser fichas fijas violetas.
      schedule(() => {
        setBoard((prev) => {
          const next = new Map(prev);
          U_OFFSETS.forEach((o, i) => {
            next.set(cellKey(SETTLE_ANCHOR.row + o.row, SETTLE_ANCHOR.col + o.col), {
              label: letters[i],
              isFiller: true,
              isPiece: true,
            });
          });
          return next;
        });
        setPieceAnchor(null);
      }, delay + LANDED_PAUSE_MS);
      delay += LANDED_PAUSE_MS;

      delay = scheduleSelectionRound(ROUND_1.map((w) => w.pos), delay);
      delay += BETWEEN_ROUNDS_PAUSE_MS;
      delay = scheduleSelectionRound(ROUND_2.map((w) => w.pos), delay);

      schedule(runCycle, delay + RESET_PAUSE_MS);
    }

    runCycle();

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, []);

  const selectedKeys = new Set(selectionPath.slice(0, selectedCount).map((c) => cellKey(c.row, c.col)));
  // Celdas de la pieza mientras se desliza (todavía no asentada).
  const slidingPiece = new Map<string, string>();
  if (pieceAnchor) {
    U_OFFSETS.forEach((o, i) => {
      slidingPiece.set(cellKey(pieceAnchor.row + o.row, pieceAnchor.col + o.col), pieceLetters[i]);
    });
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${DEMO_SIZE}, 1fr)`,
        gridTemplateRows: `repeat(${DEMO_SIZE}, 1fr)`,
        gap: "3px",
        width: "100%",
        aspectRatio: "1 / 1",
      }}
    >
      {Array.from({ length: DEMO_SIZE }, (_, row) =>
        Array.from({ length: DEMO_SIZE }, (_, col) => {
          const key = cellKey(row, col);
          const cell = board.get(key);
          const isSelected = selectedKeys.has(key);
          const slidingLetter = slidingPiece.get(key);
          const isSliding = slidingLetter !== undefined && !cell;

          let backgroundColor: string = LETRIS_PALETTE.lockedBg;
          let color: string = LETRIS_PALETTE.emptyText;
          if (!cell && !isSliding) {
            backgroundColor = "#f3f3f3";
          } else if (isSelected && flashSuccess) {
            backgroundColor = "#22c55e";
            color = "#fff";
          } else if (isSelected) {
            backgroundColor = LETRIS_PALETTE.selectedBg;
            color = LETRIS_PALETTE.selectedText;
          } else if (isSliding || cell?.isPiece) {
            backgroundColor = PIECE_COLORS[1];
            color = "#fff";
          }

          return (
            <Box
              key={key}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "3px",
                fontWeight: 800,
                fontSize: { xs: 11, sm: 13 },
                fontFamily: "monospace",
                backgroundColor,
                color,
                transition: "background-color 0.15s, color 0.15s",
              }}
            >
              {cell?.label ?? (isSliding ? slidingLetter : "")}
            </Box>
          );
        }),
      )}
    </Box>
  );
}
