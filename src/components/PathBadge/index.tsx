import { BadgeState } from "../../hooks/usePathSelection";
import styles from "./PathBadge.module.css";

interface PathBadgeProps {
  badge: BadgeState | null;
}

export default function PathBadge({ badge }: PathBadgeProps) {
  if (!badge) return null;
  const { evaluation } = badge;
  const statusClass = evaluation.status === "ok" ? styles.ten : evaluation.status === "over" ? styles.over : "";

  return (
    <div className={`${styles.badge} ${statusClass}`} style={{ left: badge.x, top: badge.y }}>
      {evaluation.liveLabel}
    </div>
  );
}
