import { RefObject } from "react";
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
}

function has(cells: GridPos[] | null, r: number, c: number): boolean {
  return !!cells?.some((cell) => cell.r === r && cell.c === c);
}

export default function Board({ boardRef, grid, colorGrid, engine, path, ghostCells, clearingCells, onPointerDown }: BoardProps) {
  const headCell = path && path.length > 0 ? path[path.length - 1] : null;

  return (
    <div ref={boardRef} className={styles.board} onPointerDown={onPointerDown}>
      {grid.map((row, r) =>
        row.map((value, c) => {
          const ghost = ghostCells && has(ghostCells.cells, r, c) ? (ghostCells.valid ? "ok" : "bad") : null;
          return (
            <Cell
              key={`${r}-${c}`}
              r={r}
              c={c}
              label={value === null ? "" : engine.cellLabel(value)}
              color={colorGrid[r][c]}
              filled={value !== null}
              ghost={ghost}
              selected={has(path, r, c)}
              isHead={headCell?.r === r && headCell?.c === c}
              clearing={has(clearingCells, r, c)}
            />
          );
        }),
      )}
    </div>
  );
}
