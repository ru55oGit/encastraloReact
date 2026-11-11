// Copiado de boludeando-ads/sdk/boludeando-ads-client/src/useRewardedAd.ts el 2026-10-08.
// track() de analytics.ts agregado localmente (2026-10-16) — no está en la
// fuente del SDK todavía, portar si se vuelve a copiar desde ahí.
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchNextAd, reportImpression, reportReward, reportClick } from "./adClient";
import { getAdSessionId } from "./adSessionId";
import { getCooldownRemainingSeconds, setCooldown } from "./adFrequencyCap";
import { track } from "../lib/analytics";
import type { AdCreative } from "./types";

// Tiempo mínimo mirando el creative antes de poder confirmar la
// recompensa — evita que alguien dispare requestAd + handleAdWatched en
// el mismo tick sin que medie ninguna visualización real. Igual que el
// resto de los timers de este proyecto, no es anti-fraude robusto, es
// proporcional al tamaño del proyecto.
const MIN_VIEW_SECONDS = 10;

export function useRewardedAd(
  slot: string,
  gameSlug: string,
  locale: string,
  grantReward: () => void,
  rewardType: string = "extra_life",
) {
  const [loadingAd, setLoadingAd] = useState(false);
  const [adCreative, setAdCreative] = useState<AdCreative | null>(null);
  // Separado de adCreative: en el caso fallback (sin inventario real)
  // adCreative queda null pero igual hay token para reclamar la recompensa
  // — ver RewardedFallbackCreative.
  const [rewardToken, setRewardToken] = useState<string | null>(null);
  const [showingAd, setShowingAd] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(() => getCooldownRemainingSeconds(slot));
  const [secondsUntilCanConfirm, setSecondsUntilCanConfirm] = useState(MIN_VIEW_SECONDS);
  const impressionIdRef = useRef<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setCooldownSeconds(getCooldownRemainingSeconds(slot)), 1000);
    return () => clearInterval(interval);
  }, [slot]);

  useEffect(() => {
    if (!showingAd) {
      setSecondsUntilCanConfirm(MIN_VIEW_SECONDS);
      return;
    }
    const interval = setInterval(() => {
      setSecondsUntilCanConfirm((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [showingAd]);

  const canShowAd = cooldownSeconds <= 0 && !loadingAd && !showingAd;
  const canConfirmReward = showingAd && secondsUntilCanConfirm <= 0;

  const requestAd = useCallback(async () => {
    if (!canShowAd) return;

    setLoadingAd(true);
    try {
      const sessionId = getAdSessionId();
      const { ad, rewardToken: fallbackToken } = await fetchNextAd(slot, locale, sessionId);

      // Con creative real el token viaja en ad.rewardToken; sin inventario
      // (fallback "anunciá acá") viaja suelto en fallbackToken — cualquiera
      // de los dos alcanza para poder reclamar la recompensa.
      const token = ad?.rewardToken ?? fallbackToken;
      if (!token) {
        // Ni ad real ni fallback: slot mal configurado como no-rewarded.
        return;
      }

      setAdCreative(ad);
      setRewardToken(token);
      setShowingAd(true);
      if (ad) {
        track("ad_impression", { ad_slot: slot, creative_id: ad.creativeId });
        reportImpression(ad, gameSlug, sessionId, locale).then((id) => {
          impressionIdRef.current = id;
        });
      }
    } catch {
      // Un fallo de red (fetch rechazado, JSON inválido) no debe dejar
      // loadingAd trabado en true para siempre — sin este finally, canShowAd
      // queda false y el botón no vuelve a responder hasta recargar la página.
    } finally {
      setLoadingAd(false);
    }
  }, [canShowAd, slot, gameSlug, locale]);

  const resetAfterAd = useCallback(() => {
    setShowingAd(false);
    setAdCreative(null);
    setRewardToken(null);
    impressionIdRef.current = null;
    setCooldown(slot);
    setCooldownSeconds(getCooldownRemainingSeconds(slot));
  }, [slot]);

  const handleAdWatched = useCallback(async () => {
    if (!canConfirmReward || !rewardToken) return;

    const sessionId = getAdSessionId();
    const ok = await reportReward(rewardToken, gameSlug, sessionId, rewardType);
    resetAfterAd();
    if (ok) grantReward();
  }, [canConfirmReward, rewardToken, gameSlug, rewardType, grantReward, resetAfterAd]);

  const handleAdSkipped = useCallback(() => {
    resetAfterAd();
  }, [resetAfterAd]);

  // La imagen/video del creative también es clickeable (va al clickUrl del
  // anunciante, como cualquier banner) — esto solo reporta la métrica, la
  // navegación la hace el <a href> en RewardedAdModal.
  const handleImageClick = useCallback(() => {
    track("ad_click", { ad_slot: slot, creative_id: adCreative?.creativeId });
    reportClick(impressionIdRef.current);
  }, [slot, adCreative]);

  return {
    loadingAd,
    adCreative,
    showingAd,
    canShowAd,
    canConfirmReward,
    secondsUntilCanConfirm,
    requestAd,
    handleAdWatched,
    handleAdSkipped,
    handleImageClick,
  };
}
