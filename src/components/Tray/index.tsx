import { Grid, Piece, VariantEngine } from "../../game/types";
import TrayPiece from "../TrayPiece";
import styles from "./Tray.module.css";

interface TrayProps {
  tray: (Piece | null)[];
  grid: Grid;
  engine: VariantEngine;
  draggingIndex: number | null;
  onPieceDown: (e: React.PointerEvent, index: number, piece: Piece) => void;
}

export default function Tray({ tray, grid, engine, draggingIndex, onPieceDown }: TrayProps) {
  return (
    <div className={styles.tray}>
      {tray.map((piece, index) => (
        <div key={index} className={styles.slot}>
          {piece && (
            <TrayPiece
              key={piece.id}
              piece={piece}
              grid={grid}
              engine={engine}
              dragging={draggingIndex === index}
              onPointerDown={(e) => onPieceDown(e, index, piece)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
