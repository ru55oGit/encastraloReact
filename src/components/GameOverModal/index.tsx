import { Variant } from "../../game/types";
import styles from "./GameOverModal.module.css";

interface GameOverModalProps {
  open: boolean;
  variant: Variant;
  score: number;
  onRestart: () => void;
}

const MESSAGES: Record<Variant, string> = {
  numbers: "No entra ninguna pieza y no queda ningún camino que sume 10.",
  words: "No entra ninguna pieza y no queda ninguna palabra posible.",
};

export default function GameOverModal({ open, variant, score, onRestart }: GameOverModalProps) {
  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.box}>
        <h2>¡Se trabó!</h2>
        <div>{MESSAGES[variant]}</div>
        <div style={{ marginTop: 8 }}>
          Puntos: <b>{score}</b>
        </div>
        <button type="button" onClick={onRestart}>
          Jugar de nuevo
        </button>
      </div>
    </div>
  );
}
