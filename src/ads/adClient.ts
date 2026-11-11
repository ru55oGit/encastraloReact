// Copiado de boludeando-ads/sdk/boludeando-ads-client/src/adClient.ts el 2026-10-09.
import type { AdCreative } from "./types";

const API_BASE = "https://ads-api.boludeando.com/api";

export interface NextAdResult {
  ad: AdCreative | null;
  // "ad_free" = el dispositivo pagó para sacarse los anuncios — a
  // diferencia de "no_fill"/"slot_not_found", acá NO hay que mostrar
  // ningún fallback, el jugador pagó justamente para no ver nada.
  reason?: string;
  // Solo en slots 'rewarded' sin inventario real (reason: "no_fill"): token
  // para poder reclamar la recompensa igual mirando el fallback de
  // "anunciá acá" en vez de un creative real.
  rewardToken?: string;
}

export async function fetchNextAd(
  slot: string,
  locale: string,
  sessionId: string,
): Promise<NextAdResult> {
  try {
    const params = new URLSearchParams({ slot, locale, session: sessionId });
    const res = await fetch(`${API_BASE}/ads/next?${params.toString()}`);
    if (!res.ok) return { ad: null };
    return (await res.json()) as NextAdResult;
  } catch {
    // Un fetch() que rechaza (CORS, red caída, lo que sea) no debe dejar al
    // caller (HouseAdBanner/useRewardedAd) esperando una promesa que nunca
    // resuelve — sin esto, el .then() nunca corre y ni el fallback de
    // "anunciá acá" se llega a mostrar, queda un hueco en blanco.
    return { ad: null };
  }
}

export async function reportImpression(
  ad: AdCreative,
  gameSlug: string,
  sessionId: string,
  locale: string,
): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/events/impression`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creativeId: ad.creativeId,
        slotId: ad.slotId,
        gameSlug,
        sessionId,
        locale,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { impressionId: string };
    return data.impressionId;
  } catch {
    // Un fallo de red al reportar la métrica no debe romper el juego.
    return null;
  }
}

export async function reportClick(impressionId: string | null): Promise<void> {
  if (!impressionId) return;
  try {
    await fetch(`${API_BASE}/events/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ impressionId }),
    });
  } catch {
    // Igual que arriba: no bloquear la navegación del usuario por esto.
  }
}

export async function reportReward(
  rewardToken: string,
  gameSlug: string,
  sessionId: string,
  rewardType: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/events/reward`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardToken, gameSlug, sessionId, rewardType }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
