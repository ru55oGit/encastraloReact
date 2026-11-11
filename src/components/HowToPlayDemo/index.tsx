import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import { LETRIS_PALETTE, PIECE_COLORS } from "../../game/constants";

// Mismo patrón que letrisReact/viborealoReact (HowToPlayDemo/SnakeDemo):
// un ciclo guionado (no el motor real) a base de setTimeout encadenados,
// que se vuelve a programar solo al final. 8x8 en vez del 8x7 que usan
// esos dos — acá sí tiene que coincidir con la grilla real, que es
// cuadrada, a diferencia de sus tableros rectangulares.
//
// Solo muestra la variante "words" (el juego principal) — mezclar las 3
// variantes en la misma demo quedaba confuso, ver feedback del usuario.
const DEMO_SIZE = 8;

interface DemoCellPos {
  row: number;
  col: number;
}

interface DemoCell {
  label: string;
  isFiller: boolean; // relleno decorativo, no forma parte de ninguna ronda
}

// Ronda 1: camino recto. Ronda 2: camino doblado — misma mecánica, para
// mostrar que no hace falta una línea recta (igual que el demo de Letris).
const ROUND_1: { pos: DemoCellPos; label: string }[] = [
  { pos: { row: 3, col: 2 }, label: "S" },
  { pos: { row: 3, col: 3 }, label: "O" },
  { pos: { row: 3, col: 4 }, label: "L" },
];
const ROUND_2: { pos: DemoCellPos; label: string }[] = [
  { pos: { row: 5, col: 5 }, label: "R" },
  { pos: { row: 6, col: 5 }, label: "I" },
  { pos: { row: 6, col: 4 }, label: "O" },
];

const FILLER_LETTERS = "ETANRC";
const FILLER_SPOTS: DemoCellPos[] = [
  { row: 0, col: 0 },
  { row: 1, col: 6 },
  { row: 2, col: 1 },
  { row: 4, col: 7 },
  { row: 6, col: 1 },
  { row: 7, col: 5 },
];

const SLIDE_STEP_MS = 160;
const LANDED_PAUSE_MS = 400;
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
  return board;
}

export default function HowToPlayDemo() {
  const [board, setBoard] = useState<Map<string, DemoCell>>(() => buildInitialBoard());
  const [piecePos, setPiecePos] = useState<DemoCellPos | null>(null);
  const [pieceLetter, setPieceLetter] = useState(randomLetter());
  const [selectionPath, setSelectionPath] = useState<DemoCellPos[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [flashSuccess, setFlashSuccess] = useState(false);

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    function schedule(fn: () => void, delay: number) {
      const id = setTimeout(fn, delay);
      timeoutsRef.current.push(id);
    }

    // Anima la selección progresiva de `cells`, flashea en verde al
    // formar la palabra, y las borra. Devuelve cuánto delay total consumió.
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
      setPiecePos(null);

      // Una pieza "entra" deslizándose en diagonal (como un arrastre real,
      // no una caída tipo Tetris) y se funde al tablero como relleno.
      const letter = randomLetter();
      setPieceLetter(letter);
      const target: DemoCellPos = { row: 1, col: 1 };
      const slideSteps: DemoCellPos[] = [
        { row: 7, col: 7 },
        { row: 5, col: 5 },
        { row: 3, col: 3 },
        target,
      ];
      let delay = SLIDE_STEP_MS;
      for (const step of slideSteps) {
        schedule(() => setPiecePos(step), delay);
        delay += SLIDE_STEP_MS;
      }

      schedule(() => {
        setBoard((prev) => {
          const next = new Map(prev);
          next.set(cellKey(target.row, target.col), { label: letter, isFiller: true });
          return next;
        });
        setPiecePos(null);
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
  const pieceKey = piecePos ? cellKey(piecePos.row, piecePos.col) : null;

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
          const isPiece = pieceKey === key && !cell;

          let backgroundColor: string = LETRIS_PALETTE.lockedBg;
          let color: string = LETRIS_PALETTE.emptyText;
          if (!cell && !isPiece) {
            backgroundColor = "#f3f3f3";
          } else if (isSelected && flashSuccess) {
            backgroundColor = "#22c55e";
            color = "#fff";
          } else if (isSelected) {
            backgroundColor = LETRIS_PALETTE.selectedBg;
            color = LETRIS_PALETTE.selectedText;
          } else if (isPiece) {
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
              {cell?.label ?? (isPiece ? pieceLetter : "")}
            </Box>
          );
        }),
      )}
    </Box>
  );
}
