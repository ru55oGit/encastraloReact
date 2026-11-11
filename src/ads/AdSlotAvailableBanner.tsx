// Copiado de boludeando-ads/sdk/boludeando-ads-client/src/AdSlotAvailableBanner.tsx el 2026-10-10.
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { getAdFallbackCopy } from "./adFallbackCopy";

// Fallback que HouseAdBanner muestra en vez de nada cuando un slot
// house/sold no tiene ninguna creatividad real elegible: en vez de dejar el
// espacio en blanco, invita a anunciar ahí mismo. Diseño armado por el
// usuario (banner-anuncia.html), portado a React/MUI acá.
const ROTATE_INTERVAL_MS = 2800;
const EXIT_DURATION_MS = 500;

// Los precios están en ARS. Mostrar los tiles de dígitos sin aclarar
// moneda hace que alguien pensando en dólares los lea como un precio
// carísimo en vez de casi simbólico — se agrega la bandera y el
// equivalente aproximado en USD. Cotización oficial fijada a mano (no hay
// API de cambio conectada); actualizar cada tanto, no hace falta que sea
// exacta al centavo.
const USD_RATE_ARS = 1535; // oficial, 2026-10-13
function formatUsdEquivalent(priceArs: number): string {
  const usd = priceArs / USD_RATE_ARS;
  return `≈US$${usd.toFixed(2)}`;
}

// El ?lang= precarga el idioma objetivo de la campaña en el alta del
// anunciante (ver Login.tsx/Dashboard.tsx en boludeando-ads).
function signupUrl(locale: string | undefined): string {
  const base = "https://ads-api.boludeando.com/login";
  return locale ? `${base}?lang=${encodeURIComponent(locale)}` : base;
}

interface AdSlotAvailableBannerProps {
  // 1000 = tier "banner" (default, ver adFormats.ts). Pasar 2000 para el
  // fallback del slot "banner doble". Sin separador de miles en los tiles:
  // ocupa menos ancho horizontal y deja más lugar al texto rotativo.
  weeklyPrice?: number;
  // true para el fallback del slot "banner doble" — layout vertical propio
  // (no la misma fila horizontal estirada), porque una campaña real ahí se
  // renderiza a aspect-ratio 2:1 (HouseAdBanner), el doble de alto que el
  // banner simple 4:1, y una fila horizontal centrada en una caja el doble
  // de alta deja la mitad del espacio vacío arriba/abajo sin usar.
  double?: boolean;
  // es/en/pt — fr/de (y cualquier otro) caen a español por ahora
  // (ver adFallbackCopy.ts, 2026-10-10).
  locale?: string;
  accentColor?: string;
  inkColor?: string;
}

function useRotatingLine(lineCount: number) {
  const [index, setIndex] = useState(0);
  const [exitingIndex, setExitingIndex] = useState<number | null>(null);

  useEffect(() => {
    setIndex(0);
    setExitingIndex(null);
  }, [lineCount]);

  useEffect(() => {
    const rotate = setInterval(() => {
      setIndex((current) => {
        setExitingIndex(current);
        return (current + 1) % lineCount;
      });
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(rotate);
  }, [lineCount]);

  useEffect(() => {
    if (exitingIndex === null) return;
    const clear = setTimeout(() => setExitingIndex(null), EXIT_DURATION_MS);
    return () => clearTimeout(clear);
  }, [exitingIndex]);

  return { index, exitingIndex };
}

export default function AdSlotAvailableBanner({
  weeklyPrice = 1000,
  double = false,
  locale,
  accentColor = "#e74c3c",
  inkColor = "#3a1512",
}: AdSlotAvailableBannerProps) {
  const copy = getAdFallbackCopy(locale);
  const priceTiles = ["$", ...String(weeklyPrice).split("")];
  const { index, exitingIndex } = useRotatingLine(copy.rotatingLines.length);
  const paper = "#fff8f3";
  const ariaLabel = copy.ariaLabel(weeklyPrice);

  if (double) {
    // Layout vertical en 3 filas (kicker / texto rotativo a 2 líneas /
    // precio + flecha), con justify-content:space-between para que la
    // altura extra se reparta entre las 3 en vez de quedar como padding
    // muerto arriba y abajo de una sola fila centrada.
    return (
      <Box
        component="a"
        href={signupUrl(locale)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 1,
          width: "100%",
          mx: "auto",
          boxSizing: "border-box",
          minHeight: 160,
          p: "18px 20px",
          backgroundColor: paper,
          borderRadius: "24px",
          textDecoration: "none",
          color: inkColor,
          overflow: "hidden",
          isolation: "isolate",
          transition: "transform 0.15s ease",
          "&:hover": { transform: "translateY(-1px)" },
          "&:active": { transform: "scale(0.985)" },
          "&::before": {
            content: '""',
            position: "absolute",
            inset: "5px",
            borderRadius: "19px",
            border: `2px dashed ${accentColor}73`,
            pointerEvents: "none",
            zIndex: -1,
          },
        }}
      >
        <Box component="span" sx={{ fontSize: 13, fontWeight: 700, color: `${inkColor}99` }}>
          {copy.kicker}
        </Box>

        <Box sx={{ position: "relative", height: 48, overflow: "hidden" }}>
          {copy.rotatingLines.map((line, i) => {
            const isIn = i === index;
            const isOut = i === exitingIndex;
            return (
              <Box
                key={line}
                sx={{
                  position: "absolute",
                  inset: 0,
                  fontSize: 18,
                  lineHeight: "24px",
                  fontWeight: 900,
                  letterSpacing: "-0.01em",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  transform: isIn ? "translateY(0)" : isOut ? "translateY(-110%)" : "translateY(110%)",
                  opacity: isIn ? 1 : 0,
                  transition: "transform 0.45s cubic-bezier(.2,.8,.2,1), opacity 0.3s",
                }}
              >
                {line}
              </Box>
            );
          })}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box component="span" sx={{ fontSize: 16 }}>
                🇦🇷
              </Box>
              <Box sx={{ display: "flex", gap: "3px" }}>
                {priceTiles.map((ch, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: "grid",
                      placeItems: "center",
                      width: 22,
                      height: 30,
                      backgroundColor: accentColor,
                      color: "#fff",
                      borderRadius: "6px",
                      fontWeight: 900,
                      fontSize: 17,
                      boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.18)",
                    }}
                  >
                    {ch}
                  </Box>
                ))}
              </Box>
              <Box component="span" sx={{ fontSize: 12, fontWeight: 800, color: accentColor }}>
                {copy.perWeek}
              </Box>
            </Box>
            <Box component="span" sx={{ fontSize: 10, fontWeight: 700, color: `${inkColor}80` }}>
              {formatUsdEquivalent(weeklyPrice)}
            </Box>
          </Box>

          <Box
            sx={{
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              width: 48,
              height: 48,
              borderRadius: "50%",
              backgroundColor: inkColor,
              color: paper,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width={22}
              height={22}
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      component="a"
      href={signupUrl(locale)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        width: "100%",
        mx: "auto",
        boxSizing: "border-box",
        minHeight: 80,
        p: "12px 12px 12px 16px",
        backgroundColor: paper,
        borderRadius: "20px",
        textDecoration: "none",
        color: inkColor,
        overflow: "hidden",
        isolation: "isolate",
        transition: "transform 0.15s ease",
        "&:hover": { transform: "translateY(-1px)" },
        "&:active": { transform: "scale(0.985)" },
        "&::before": {
          content: '""',
          position: "absolute",
          inset: "5px",
          borderRadius: "15px",
          border: `2px dashed ${accentColor}73`,
          pointerEvents: "none",
          zIndex: -1,
        },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          component="span"
          sx={{ display: "block", fontSize: 12, fontWeight: 700, color: `${inkColor}99`, mb: 0.25 }}
        >
          {copy.kicker}
        </Box>
        <Box sx={{ position: "relative", height: 24, overflow: "hidden" }}>
          {copy.rotatingLines.map((line, i) => {
            const isIn = i === index;
            const isOut = i === exitingIndex;
            return (
              <Box
                key={line}
                sx={{
                  position: "absolute",
                  inset: 0,
                  fontSize: { xs: 14, sm: 16 },
                  lineHeight: "24px",
                  fontWeight: 900,
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  transform: isIn ? "translateY(0)" : isOut ? "translateY(-110%)" : "translateY(110%)",
                  opacity: isIn ? 1 : 0,
                  transition: "transform 0.45s cubic-bezier(.2,.8,.2,1), opacity 0.3s",
                }}
              >
                {line}
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box sx={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "3px" }}>
          <Box component="span" sx={{ fontSize: 12 }}>
            🇦🇷
          </Box>
          {priceTiles.map((ch, i) => (
            <Box
              key={i}
              sx={{
                display: "grid",
                placeItems: "center",
                width: 15,
                height: 24,
                backgroundColor: accentColor,
                color: "#fff",
                borderRadius: "5px",
                fontWeight: 900,
                fontSize: 14,
                boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.18)",
              }}
            >
              {ch}
            </Box>
          ))}
        </Box>
        <Box component="span" sx={{ fontSize: 11, fontWeight: 800, color: accentColor }}>
          {copy.perWeek}
        </Box>
        <Box component="span" sx={{ fontSize: 9, fontWeight: 700, color: `${inkColor}80`, whiteSpace: "nowrap" }}>
          {formatUsdEquivalent(weeklyPrice)}
        </Box>
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          width: 40,
          height: 40,
          borderRadius: "50%",
          backgroundColor: inkColor,
          color: paper,
          "@media (max-width: 360px)": { display: "none" },
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width={18}
          height={18}
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Box>
    </Box>
  );
}
