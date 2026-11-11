import { useEffect } from "react";

const ADSENSE_CLIENT = "ca-pub-6825837607163963";
const SCRIPT_ID = "adsbygoogle-script";

// Se monta solo en pantallas con contenido real (Home, Privacidad) — nunca
// en /game, que es una interfaz de juego sin texto. AdSense rechazó
// Enganchalo por "anuncios servidos por Google en pantallas sin contenido
// del editor" por este mismo motivo, así que el script ni se carga si no
// hay contenido alrededor.
export default function AdsenseScript() {
  useEffect(() => {
    if (document.getElementById(SCRIPT_ID)) return;
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
  }, []);

  return null;
}
