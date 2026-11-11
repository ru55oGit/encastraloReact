import { Variant } from "../../game/types";
import styles from "./ModeToggle.module.css";

interface ModeToggleProps {
  variant: Variant;
  onChange: (variant: Variant) => void;
}

export default function ModeToggle({ variant, onChange }: ModeToggleProps) {
  return (
    <div className={styles.modes}>
      <button
        type="button"
        className={`${styles.modebtn} ${variant === "numbers" ? styles.active : ""}`}
        onClick={() => onChange("numbers")}
      >
        🔢 Números
      </button>
      <button
        type="button"
        className={`${styles.modebtn} ${variant === "words" ? styles.active : ""}`}
        onClick={() => onChange("words")}
      >
        🔤 Palabras
      </button>
    </div>
  );
}
