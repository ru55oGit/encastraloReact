import styles from "./Cell.module.css";

interface CellProps {
  r: number;
  c: number;
  label: string;
  color: string | null;
  filled: boolean;
  ghost: "ok" | "bad" | null;
  selected: boolean;
  isHead: boolean;
  clearing: boolean;
  // Paleta de Letris (ver LETRIS_PALETTE en game/constants.ts), solo para
  // la variante "words" — cuando vienen seteados reemplazan el color de
  // pieza y la clase .selected/.head de este cell puntual (ver Board).
  flatBackground?: string;
  flatTextColor?: string;
}

export default function Cell({ r, c, label, color, filled, ghost, selected, isHead, clearing, flatBackground, flatTextColor }: CellProps) {
  const classNames = [
    styles.cell,
    filled && styles.filled,
    ghost === "ok" && styles.ghostOk,
    ghost === "bad" && styles.ghostBad,
    selected && styles.selected,
    selected && isHead && styles.head,
    clearing && styles.clearing,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classNames}
      data-row={r}
      data-col={c}
      style={{
        background: ghost ? undefined : (flatBackground ?? color ?? undefined),
        color: flatTextColor,
      }}
    >
      {label}
    </div>
  );
}
