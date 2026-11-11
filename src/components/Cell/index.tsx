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
}

export default function Cell({ r, c, label, color, filled, ghost, selected, isHead, clearing }: CellProps) {
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
      style={{ background: ghost ? undefined : (color ?? undefined) }}
    >
      {label}
    </div>
  );
}
