// Copiado de boludeando-ads/sdk/boludeando-ads-client/src/ShareButtons.tsx el 2026-10-11.
// track() de analytics.ts agregado localmente (2026-10-16) — no está en la
// fuente del SDK todavía, portar si se vuelve a copiar desde ahí.
import Box from "@mui/material/Box";
import { track } from "../lib/analytics";

// Solo WhatsApp y Facebook: son las dos redes con un link de "compartir"
// real que abre con el texto/URL precargado. Instagram no tiene equivalente
// (no existe un instagram.com/share?... web) — se descartó, no es una
// limitación de este código sino de la plataforma. Comparte siempre el hub
// (boludeando.com), no el juego puntual donde se clickea — por eso no
// depende del Translation de cada juego, trae su propio diccionario chico
// (mismo alcance es/en/pt que adFallbackCopy.ts; fr/de caen a español).
const HUB_URL = "https://www.boludeando.com";

interface ShareCopy {
  label: string;
  shareText: string;
}

const COPY: Record<string, ShareCopy> = {
  es: { label: "Compartí Boludeando", shareText: "Boludeando — Juegos mentales en vez de scroll infinito" },
  en: { label: "Share Boludeando", shareText: "Boludeando — Mental games instead of infinite scroll" },
  pt: { label: "Compartilhe o Boludeando", shareText: "Boludeando — Jogos mentais em vez de scroll infinito" },
};

function getCopy(locale: string | undefined): ShareCopy {
  return COPY[locale ?? "es"] ?? COPY.es;
}

function whatsappShareUrl(shareText: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${shareText} ${HUB_URL}`)}`;
}

function facebookShareUrl(): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(HUB_URL)}`;
}

interface ShareButtonsProps {
  locale?: string;
}

export default function ShareButtons({ locale }: ShareButtonsProps) {
  const copy = getCopy(locale);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, mt: 3 }}>
      <Box sx={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{copy.label}</Box>
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <Box
          component="a"
          href={whatsappShareUrl(copy.shareText)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartir por WhatsApp"
          onClick={() => track("share", { method: "whatsapp" })}
          sx={{
            display: "grid",
            placeItems: "center",
            width: 48,
            height: 48,
            borderRadius: "50%",
            backgroundColor: "#25D366",
            color: "#fff",
            transition: "transform 0.15s ease",
            "&:hover": { transform: "translateY(-2px)" },
          }}
        >
          <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.74.46 3.43 1.32 4.92L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 1.67c2.2 0 4.26.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.14.82.84-3.06-.2-.31a8.17 8.17 0 0 1-1.25-4.36c0-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09 0 1.23.9 2.42 1.02 2.58.12.17 1.75 2.67 4.3 3.74.6.26 1.07.41 1.44.52.6.19 1.15.17 1.58.1.48-.07 1.48-.6 1.69-1.19.21-.58.21-1.08.15-1.19-.06-.1-.23-.17-.48-.29-.25-.12-1.48-.73-1.71-.81-.23-.08-.4-.12-.56.13-.17.25-.65.81-.79.98-.15.17-.29.19-.54.06-.25-.12-1.04-.38-1.99-1.23-.73-.66-1.23-1.46-1.37-1.71-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.37-.78-1.87-.2-.49-.41-.42-.56-.43-.14-.01-.31-.01-.48-.01Z" />
          </svg>
        </Box>

        <Box
          component="a"
          href={facebookShareUrl()}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartir por Facebook"
          onClick={() => track("share", { method: "facebook" })}
          sx={{
            display: "grid",
            placeItems: "center",
            width: 48,
            height: 48,
            borderRadius: "50%",
            backgroundColor: "#1877F2",
            color: "#fff",
            transition: "transform 0.15s ease",
            "&:hover": { transform: "translateY(-2px)" },
          }}
        >
          <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95Z" />
          </svg>
        </Box>
      </Box>
    </Box>
  );
}
