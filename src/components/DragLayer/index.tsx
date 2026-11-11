import { DragVisual } from "../../hooks/usePieceDrag";
import { VariantEngine } from "../../game/types";
import { pieceDims } from "../../game/pieces";
import styles from "./DragLayer.module.css";

interface DragLayerProps {
  drag: DragVisual | null;
  engine: VariantEngine;
}

export default function DragLayer({ drag, engine }: DragLayerProps) {
  if (!drag) return null;
  const { width, height } = pieceDims(drag.piece);

  return (
    <div
      className={styles.drag}
      style={{
        transform: `translate(${drag.left}px, ${drag.top}px)`,
        gridTemplateColumns: `repeat(${width}, ${drag.cellSize}px)`,
        gridTemplateRows: `repeat(${height}, ${drag.cellSize}px)`,
      }}
    >
      {drag.piece.cells.map((cell, i) => (
        <div
          key={i}
          className={styles.pc}
          style={{
            gridRow: cell.r + 1,
            gridColumn: cell.c + 1,
            width: drag.cellSize,
            height: drag.cellSize,
            fontSize: drag.cellSize * 0.62,
            background: drag.piece.color,
          }}
        >
          {engine.cellLabel(cell.value)}
        </div>
      ))}
    </div>
  );
}
