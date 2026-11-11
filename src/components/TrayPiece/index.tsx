import { useEffect, useState } from "react";
import { fitsAnywhere } from "../../game/board";
import { pieceDims } from "../../game/pieces";
import { Grid, Piece, VariantEngine } from "../../game/types";
import styles from "./TrayPiece.module.css";

interface TrayPieceProps {
  piece: Piece;
  grid: Grid;
  engine: VariantEngine;
  dragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
}

// Tamaño de cada celdita dentro de la bandeja: depende del ancho de
// pantalla (3 slots) y del ancho de la pieza — Math.max(w,3) evita que una
// pieza angosta (ej. el punto) se vea gigante ocupando todo el slot.
function useTraySlotCellSize(pieceWidth: number): number {
  const compute = () => Math.min(26, Math.floor((window.innerWidth / 3 - 24) / Math.max(pieceWidth, 3)));
  const [size, setSize] = useState(compute);
  useEffect(() => {
    const onResize = () => setSize(compute());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieceWidth]);
  return size;
}

export default function TrayPiece({ piece, grid, engine, dragging, onPointerDown }: TrayPieceProps) {
  const { width, height } = pieceDims(piece);
  const size = useTraySlotCellSize(width);
  const nofit = !fitsAnywhere(grid, piece);

  return (
    <div
      className={`${styles.piece} ${dragging ? styles.draggingSrc : ""} ${nofit ? styles.nofit : ""}`}
      style={{ gridTemplateColumns: `repeat(${width}, ${size}px)`, gridTemplateRows: `repeat(${height}, ${size}px)` }}
      onPointerDown={onPointerDown}
    >
      {piece.cells.map((cell, i) => (
        <div
          key={i}
          className={styles.pc}
          style={{
            gridRow: cell.r + 1,
            gridColumn: cell.c + 1,
            width: size,
            height: size,
            fontSize: size * 0.72,
            background: piece.color,
          }}
        >
          {engine.cellLabel(cell.value)}
        </div>
      ))}
    </div>
  );
}
