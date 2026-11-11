import styles from "./FloatingText.module.css";

export interface FloatingTextItem {
  id: number;
  text: string;
  x: number;
  y: number;
}

interface FloatingTextProps {
  items: FloatingTextItem[];
}

export default function FloatingText({ items }: FloatingTextProps) {
  return (
    <>
      {items.map((item) => (
        <div key={item.id} className={styles.float} style={{ left: item.x, top: item.y }}>
          {item.text}
        </div>
      ))}
    </>
  );
}
