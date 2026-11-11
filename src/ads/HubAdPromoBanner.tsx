// Copiado de boludeando-ads/sdk/boludeando-ads-client/src/HubAdPromoBanner.tsx el 2026-10-10.
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";

// Banner fijo del hub (no es un ad_slot real, ver Home.tsx) que invita a
// anunciar en los juegos de Boludeando. A diferencia de AdSlotAvailableBanner
// (que vive en cada juego individual, "este espacio está libre"), acá el
// mensaje es sobre el hub entero y muestra los 3 formatos/precios reales que
// se venden (ver adFormats.ts en boludeando-ads) en vez de un solo precio —
// por eso es un componente propio, ya no el genérico copiado del SDK.
//
// es/en/pt — mismo alcance que adFallbackCopy.ts en boludeando-ads; fr (el
// hub soporta es/en/pt/fr, ver LanguageContext.tsx) cae a español por ahora.
// El ?lang= precarga el idioma objetivo de la campaña en el alta del
// anunciante (ver Login.tsx/Dashboard.tsx en boludeando-ads) — así alguien
// que clickea esto mientras juega en portugués puede crear directamente una
// campaña que solo se le muestre a otros jugadores en portugués, sin tener
// que ir a buscar esa opción a mano.
function signupUrl(locale: string | undefined): string {
  const base = "https://ads-api.boludeando.com/login";
  return locale ? `${base}?lang=${encodeURIComponent(locale)}` : base;
}

interface HubAdPromoCopy {
  headline: string;
  perWeek: string;
  tierLabels: [string, string, string];
  ariaLabel: string;
}

const COPY: Record<string, HubAdPromoCopy> = {
  es: {
    headline: "Anunciá en los juegos de Boludeando",
    perWeek: "/sem",
    tierLabels: ["Banner", "Banner doble", "Rewarded"],
    ariaLabel: "Anunciá en los juegos de Boludeando — planes desde $1000 por semana",
  },
  en: {
    headline: "Advertise across Boludeando's games",
    perWeek: "/wk",
    tierLabels: ["Banner", "Double banner", "Rewarded"],
    ariaLabel: "Advertise across Boludeando's games — plans from $1000 a week",
  },
  pt: {
    headline: "Anuncie nos jogos do Boludeando",
    perWeek: "/sem",
    tierLabels: ["Banner", "Banner duplo", "Recompensado"],
    ariaLabel: "Anuncie nos jogos do Boludeando — planos a partir de $1000 por semana",
  },
};

function getCopy(locale: string | undefined): HubAdPromoCopy {
  return COPY[locale ?? "es"] ?? COPY.es;
}

const TIER_PRICES = [1000, 2000, 3500];

// Los precios están en ARS. Mostrar "$1000/wk" sin aclarar moneda hace que
// alguien pensando en dólares lo lea como USD (un precio carísimo) en vez
// de ARS (casi simbólico a la cotización actual) — se agrega el
// equivalente aproximado en USD al lado para que quede claro. Cotización
// oficial fijada a mano (no hay API de cambio conectada); actualizar cada
// tanto, no hace falta que sea exacta al centavo.
const USD_RATE_ARS = 1535; // oficial, 2026-10-13
function formatUsdEquivalent(priceArs: number): string {
  const usd = priceArs / USD_RATE_ARS;
  return `≈US$${usd.toFixed(2)}`;
}

// Dominios reales de los 8 juegos (mismo listado que GAMES en
// boludeando-ads/src/pages/CampaignDetail.tsx — emojinalo es el único caso
// donde el slug interno difiere del dominio en vivo, emojionado.com).
// NOTA: esta lista es el roster real de dominios del hub (copiada de
// Letris) — "encastralo.com" todavía no es un sitio publicado, así que NO
// se agrega acá hasta que esté en vivo; mientras tanto sigue listando a
// Letris, como en el resto de los repos hermanos.
const GAME_URLS = [
  "viborealo.com",
  "letris.net",
  "ensopalo.com",
  "enganchalo.com",
  "enroscado.com",
  "tuttifrutalo.com",
  "imaginaloapp.com",
  "emojionado.com",
];

// Misma paleta de 5 colores del logo BOLUDEANDO (og-image.jpg), ciclando
// letra por letra.
const TILE_COLORS = ["#e24b3f", "#f0b429", "#3f9e5e", "#4f7fd1", "#9b5fc0"];

// Tiles chicos (no el tamaño hero del logo) para que hasta el dominio más
// largo (tuttifrutalo.com, 16 caracteres) entre en una sola línea sin
// desbordar el banner en mobile. El "." se muestra como un puntito, no como
// un tile de letra — ocupar lo mismo que una letra ahí se ve raro y suma
// ancho innecesario.
function TileWord({ text }: { text: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-end", gap: "2px" }}>
      {[...text].map((ch, i) =>
        ch === "." ? (
          <Box
            key={i}
            sx={{
              width: { xs: 5, sm: 6 },
              height: { xs: 5, sm: 6 },
              borderRadius: "50%",
              backgroundColor: TILE_COLORS[i % TILE_COLORS.length],
              mb: { xs: "8px", sm: "10px" },
              flexShrink: 0,
            }}
          />
        ) : (
          <Box
            key={i}
            sx={{
              display: "grid",
              placeItems: "center",
              width: { xs: 18, sm: 24 },
              height: { xs: 25, sm: 33 },
              borderRadius: { xs: "5px", sm: "6px" },
              backgroundColor: TILE_COLORS[i % TILE_COLORS.length],
              color: "#fff",
              fontWeight: 900,
              fontSize: { xs: 13, sm: 17 },
              textTransform: "uppercase",
              boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.18)",
              flexShrink: 0,
            }}
          >
            {ch}
          </Box>
        ),
      )}
    </Box>
  );
}

const ROTATE_INTERVAL_MS = 2400;
const EXIT_DURATION_MS = 500;

// Mismo mecanismo de fade-up que useRotatingLine en AdSlotAvailableBanner
// (SDK de boludeando-ads): la línea saliente sube y se desvanece, la
// entrante sube desde abajo.
function useRotatingIndex(count: number) {
  const [index, setIndex] = useState(0);
  const [exitingIndex, setExitingIndex] = useState<number | null>(null);

  useEffect(() => {
    const rotate = setInterval(() => {
      setIndex((current) => {
        setExitingIndex(current);
        return (current + 1) % count;
      });
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(rotate);
  }, [count]);

  useEffect(() => {
    if (exitingIndex === null) return;
    const clear = setTimeout(() => setExitingIndex(null), EXIT_DURATION_MS);
    return () => clearTimeout(clear);
  }, [exitingIndex]);

  return { index, exitingIndex };
}

interface HubAdPromoBannerProps {
  locale?: string;
  accentColor?: string;
  inkColor?: string;
}

export default function HubAdPromoBanner({ locale, accentColor = "#e74c3c", inkColor = "#3a1512" }: HubAdPromoBannerProps) {
  const copy = getCopy(locale);
  const paper = "#fff8f3";
  const { index, exitingIndex } = useRotatingIndex(GAME_URLS.length);

  return (
    <Box
      component="a"
      href={signupUrl(locale)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={copy.ariaLabel}
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 1.5,
        width: "100%",
        mx: "auto",
        boxSizing: "border-box",
        minHeight: 206,
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
      <Box
        component="span"
        sx={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          fontSize: 20,
          lineHeight: "26px",
          fontWeight: 900,
          letterSpacing: "-0.01em",
          // Le deja el hueco al emoji flotante de la esquina (ver más abajo)
          // para que el título nunca envuelva debajo de él.
          pr: "34px",
        }}
      >
        {copy.headline}
      </Box>

      <Box sx={{ position: "relative", height: { xs: 30, sm: 38 }, overflow: "hidden" }}>
        {GAME_URLS.map((url, i) => {
          const isIn = i === index;
          const isOut = i === exitingIndex;
          return (
            <Box
              key={url}
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                justifyContent: "center",
                transform: isIn ? "translateY(0)" : isOut ? "translateY(-110%)" : "translateY(110%)",
                opacity: isIn ? 1 : 0,
                transition: "transform 0.45s cubic-bezier(.2,.8,.2,1), opacity 0.3s",
              }}
            >
              <TileWord text={url} />
            </Box>
          );
        })}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ display: "flex", gap: 2.5 }}>
          {copy.tierLabels.map((label, i) => (
            <Box key={label}>
              <Box component="span" sx={{ display: "block", fontSize: 11, fontWeight: 700, color: `${inkColor}99` }}>
                {label}
              </Box>
              <Box component="span" sx={{ display: "block", fontSize: 15, fontWeight: 900, color: accentColor, whiteSpace: "nowrap" }}>
                🇦🇷${TIER_PRICES[i]}
                <Box component="span" sx={{ fontSize: 10, fontWeight: 800 }}>
                  {copy.perWeek}
                </Box>
              </Box>
              <Box component="span" sx={{ display: "block", fontSize: 10, fontWeight: 700, color: `${inkColor}80`, whiteSpace: "nowrap" }}>
                {formatUsdEquivalent(TIER_PRICES[i])}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Reemplaza el botón circular con flecha (línea de abajo, ahora
          borrada): en mobile angosto ese círculo de 48px terminaba cortado
          contra el borde derecho de la card la mayoría de las veces. Un
          emoji flotante arriba a la derecha con un "tap" animado (baja,
          pausa, sube — como un dedo presionando) no tiene ancho fijo que
          desbordar y de paso deja más claro que toda la card es clickeable. */}
      <Box
        component="span"
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: 12,
          right: 16,
          fontSize: 28,
          lineHeight: 1,
          animation: "hubPromoTap 1.6s ease-in-out infinite",
          "@keyframes hubPromoTap": {
            "0%, 100%": { transform: "translateY(0) scale(1)" },
            "40%": { transform: "translateY(5px) scale(0.85)" },
            "55%": { transform: "translateY(5px) scale(0.85)" },
            "75%": { transform: "translateY(0) scale(1)" },
          },
        }}
      >
        👆
      </Box>
    </Box>
  );
}
