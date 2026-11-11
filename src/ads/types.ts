// Copiado de boludeando-ads/sdk/boludeando-ads-client/src/types.ts el 2026-10-06.
// Si cambia la API del backend, actualizar acá y en el resto de los juegos a mano.
export interface AdCreative {
  creativeId: string;
  slotId: string;
  assetUrl: string;
  clickUrl: string;
  width: number | null;
  height: number | null;
  headline: string | null;
  body: string | null;
  ctaLabel: string | null;
  // 'banner' | 'banner_double' | 'rewarded' — de campaigns.ad_format. Decide
  // la relación de aspecto al renderizar (HouseAdBanner/RewardedAdModal).
  adFormat?: string;
  rewardToken?: string;
}
