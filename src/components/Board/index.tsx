import { RefObject } from "react";
import { LETRIS_PALETTE } from "../../game/constants";
import { ColorGrid, Grid, GridPos, VariantEngine } from "../../game/types";
import Cell from "../Cell";
import styles from "./Board.module.css";

interface BoardProps {
  boardRef: RefObject<HTMLDivElement>;
  grid: Grid;
  colorGrid: ColorGrid;
  engine: VariantEngine;
  path: GridPos[] | null;
  ghostCells: { cells: GridPos[]; valid: boolean } | null;
  clearingCells: GridPos[] | null;
  onPointerDown: (e: React.PointerEvent) => void;
  // true solo para la variante "words" — reemplaza el color de pieza
  // genérico por la paleta de Letris (ver LETRIS_PALETTE).
  flatPalette?: boolean;
}

function has(cells: GridPos[] | null, r: number, c: number): boolean {
  return !!cells?.some((cell) => cell.r === r && cell.c === c);
}

export default function Board({ boardRef, grid, colorGrid, engine, path, ghostCells, clearingCells, onPointerDown, flatPalette }: BoardProps) {
  const headCell = path && path.length > 0 ? path[path.length - 1] : null;

  return (
    <div ref={boardRef} className={styles.board} onPointerDown={onPointerDown}>
      {grid.map((row, r) =>
        row.map((value, c) => {
          const ghost = ghostCells && has(ghostCells.cells, r, c) ? (ghostCells.valid ? "ok" : "bad") : null;
          const isPathCell = has(path, r, c);

          return (
            <Cell
              key={`${r}-${c}`}
              r={r}
              c={c}
              label={value === null ? "" : engine.cellLabel(value)}
              color={colorGrid[r][c]}
              filled={value !== null}
              ghost={ghost}
              selected={flatPalette ? false : isPathCell}
              isHead={flatPalette ? false : headCell?.r === r && headCell?.c === c}
              clearing={has(clearingCells, r, c)}
              flatBackground={
                flatPalette ? (isPathCell ? LETRIS_PALETTE.selectedBg : value !== null ? LETRIS_PALETTE.lockedBg : undefined) : undefined
              }
              flatTextColor={flatPalette ? (isPathCell ? LETRIS_PALETTE.selectedText : LETRIS_PALETTE.emptyText) : undefined}
            />
          );
        }),
      )}
    </div>
  );
}
