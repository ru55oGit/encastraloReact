// Copiado de boludeando-ads/sdk/boludeando-ads-client/src/HouseAdBanner.tsx el 2026-10-09.
// track() de analytics.ts agregado localmente (2026-10-16) — no está en la
// fuente del SDK todavía, portar si se vuelve a copiar desde ahí.
import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import { fetchNextAd, reportImpression, reportClick } from "./adClient";
import { getAdSessionId } from "./adSessionId";
import AdSlotAvailableBanner from "./AdSlotAvailableBanner";
import { track } from "../lib/analytics";
import type { AdCreative } from "./types";

interface HouseAdBannerProps {
  slot: string;
  gameSlug: string;
  locale: string;
  // Formato que este slot está pensado para vender — no hay forma de saberlo
  // leyendo la respuesta de /ads/next cuando no hay ninguna creativa real
  // (ad === null), así que hay que declararlo en el call-site. Solo cambia
  // qué fallback de "este lugar está libre" se muestra (precio); una vez que
  // hay un ad real, el aspect-ratio ya se decide por ad.adFormat más arriba.
  format?: "banner" | "banner_double";
}

const FALLBACK_WEEKLY_PRICE: Record<"banner" | "banner_double", number> = {
  banner: 1000,
  banner_double: 2000,
};

// 3 formatos de campaña pagos (ver migrations/0003_ad_format.sql): "banner"
// rectangular 4:1, "banner_double" el doble de alto 2:1, y "rewarded"
// pantalla completa (ese no pasa por acá, ver RewardedAdModal). HouseAdBanner
// sirve los dos primeros — la relación de aspecto se decide según el
// ad_format real de la creatividad ganadora, no un valor fijo por slot,
// porque un mismo slot 'sold' puede recibir tanto banners simples como
// dobles. 100% del ancho disponible del contenedor (que ya trae el padding
// del juego) en vez de un ancho fijo, con object-fit: cover para que
// cualquier imagen que suba un anunciante quede recortada a la proporción
// correcta en vez de desvirtuar el layout si no viene con la medida exacta.
export const BANNER_ASPECT_RATIO = "4 / 1";
export const BANNER_DOUBLE_ASPECT_RATIO = "2 / 1";

function aspectRatioFor(adFormat: string | undefined): string {
  return adFormat === "banner_double" ? BANNER_DOUBLE_ASPECT_RATIO : BANNER_ASPECT_RATIO;
}

export default function HouseAdBanner({ slot, gameSlug, locale, format = "banner" }: HouseAdBannerProps) {
  const [ad, setAd] = useState<AdCreative | null>(null);
  // null = todavía no respondió la API; false = no hay nada que mostrar
  // (ni siquiera el fallback, ver "ad_free" abajo).
  const [showFallback, setShowFallback] = useState(false);
  const impressionIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const sessionId = getAdSessionId();

    fetchNextAd(slot, locale, sessionId).then(({ ad: result, reason }) => {
      if (cancelled) return;
      if (result) {
        setAd(result);
        // creative_id en vez de campaign_id: es el identificador real que
        // trae AdCreative (ver types.ts) — no hay campaignId en la API hoy.
        track("ad_impression", { ad_slot: slot, creative_id: result.creativeId });
        reportImpression(result, gameSlug, sessionId, locale).then((id) => {
          if (!cancelled) impressionIdRef.current = id;
        });
        return;
      }
      // "ad_free": el dispositivo pagó para sacarse los anuncios — ahí sí
      // va null de verdad, ni el fallback de "anunciá acá" corresponde.
      setShowFallback(reason !== "ad_free");
    });

    return () => {
      cancelled = true;
    };
  }, [slot, gameSlug, locale]);

  if (!ad)
    return showFallback ? (
      <AdSlotAvailableBanner
        weeklyPrice={FALLBACK_WEEKLY_PRICE[format]}
        double={format === "banner_double"}
        locale={locale}
      />
    ) : null;

  return (
    <Box
      component="a"
      href={ad.clickUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        track("ad_click", { ad_slot: slot, creative_id: ad.creativeId });
        reportClick(impressionIdRef.current);
      }}
      sx={{
        display: "block",
        width: "100%",
        aspectRatio: aspectRatioFor(ad.adFormat),
        mx: "auto",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <img
        src={ad.assetUrl}
        alt={ad.headline ?? "Publicidad"}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </Box>
  );
}
