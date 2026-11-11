import styles from "./Header.module.css";

interface HeaderProps {
  score: number;
  best: number;
}

export default function Header({ score, best }: HeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>
        Encastr<span className={styles.gold}>ado</span>
      </h1>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <b>{score}</b>
          <small>Puntos</small>
        </div>
        <div className={styles.stat}>
          <b>{best}</b>
          <small>Récord</small>
        </div>
      </div>
    </header>
  );
}
