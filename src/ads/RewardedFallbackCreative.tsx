// Copiado de boludeando-ads/sdk/boludeando-ads-client/src/RewardedFallbackCreative.tsx el 2026-10-10.
import Box from "@mui/material/Box";
import { getAdFallbackCopy } from "./adFallbackCopy";

// Lo que RewardedAdModal muestra en vez de la imagen/video cuando el slot
// rewarded no tiene ningún creative real elegible: en vez de dejar al
// jugador sin su recompensa (o sin nada que "mirar"), invita a anunciar acá
// mismo. El token de recompensa para este caso lo emite /ads/next con
// creativeId null — ver api.ts — así que la recompensa real se sigue
// pudiendo reclamar normalmente.
// El ?lang= precarga el idioma objetivo de la campaña en el alta del
// anunciante (ver Login.tsx/Dashboard.tsx en boludeando-ads).
function signupUrl(locale: string | undefined): string {
  const base = "https://ads-api.boludeando.com/login";
  return locale ? `${base}?lang=${encodeURIComponent(locale)}` : base;
}

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

interface RewardedFallbackCreativeProps {
  // 3500 = tier "rewarded" (ver adFormats.ts) — es el único formato que
  // compite por este slot, así que no hace falta parametrizarlo desde
  // afuera como en AdSlotAvailableBanner.
  weeklyPrice?: number;
  // es/en/pt — fr/de caen a español por ahora (ver adFallbackCopy.ts).
  locale?: string;
}

export default function RewardedFallbackCreative({ weeklyPrice = 3500, locale }: RewardedFallbackCreativeProps) {
  const copy = getAdFallbackCopy(locale);
  const priceTiles = ["$", ...String(weeklyPrice).split("")];
  const accentColor = "#e74c3c";
  const inkColor = "#3a1512";
  const paper = "#fff8f3";

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: "20px",
        backgroundColor: paper,
        p: "20px 16px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        "&::before": {
          content: '""',
          position: "absolute",
          inset: "5px",
          borderRadius: "15px",
          border: `2px dashed ${accentColor}73`,
          pointerEvents: "none",
        },
      }}
    >
      <Box component="span" sx={{ fontSize: 13, fontWeight: 700, color: `${inkColor}99` }}>
        {copy.kicker}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <Box component="span" sx={{ fontSize: 14 }}>
          🇦🇷
        </Box>
        {priceTiles.map((ch, i) => (
          <Box
            key={i}
            sx={{
              display: "grid",
              placeItems: "center",
              width: 20,
              height: 28,
              backgroundColor: accentColor,
              color: "#fff",
              borderRadius: "5px",
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
      <Box component="span" sx={{ fontSize: 10, fontWeight: 700, color: `${inkColor}80` }}>
        {formatUsdEquivalent(weeklyPrice)}
      </Box>

      <Box sx={{ fontSize: 17, fontWeight: 900, color: inkColor, mt: 1 }}>{copy.uploadIn2Min}</Box>

      <Box
        component="a"
        href={signupUrl(locale)}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          mt: 1,
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          backgroundColor: inkColor,
          color: paper,
          borderRadius: 999,
          px: 2.5,
          py: 1.1,
          fontWeight: 800,
          fontSize: 15,
          textDecoration: "none",
        }}
      >
        {copy.wantToAdvertise}
        <svg
          viewBox="0 0 24 24"
          width={16}
          height={16}
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
