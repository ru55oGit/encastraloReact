import styles from "./Toast.module.css";

interface ToastProps {
  message: string | null;
}

export default function Toast({ message }: ToastProps) {
  return (
    <div
      className={`${styles.toast} ${message ? styles.show : ""}`}
      // El mensaje puede traer <b> para resaltar la palabra/suma (ver
      // reasonIfInvalid en los VariantEngine) — contenido propio, no de
      // usuarios, así que es seguro insertarlo tal cual.
      dangerouslySetInnerHTML={{ __html: message ?? "" }}
    />
  );
}
