// Copiado de boludeando-ads/sdk/boludeando-ads-client/src/adFallbackCopy.ts el 2026-10-09.
// Textos del fallback "este lugar está libre" (AdSlotAvailableBanner y
// RewardedFallbackCreative) — antes estaban hardcodeados en español sin
// importar el locale del juego. Por ahora solo es/en/pt (los 3 idiomas
// principales del hub); fr/de caen al español (2026-10-10).
export interface AdFallbackCopy {
  kicker: string;
  rotatingLines: string[];
  perWeek: string;
  ariaLabel: (weeklyPrice: number) => string;
  uploadIn2Min: string;
  wantToAdvertise: string;
}

const es: AdFallbackCopy = {
  kicker: "Este lugar está libre",
  rotatingLines: [
    "Tu marca podría estar acá",
    "Que te vean mientras juegan",
    "Ideal para tu emprendimiento",
    "Cargás tu aviso en 2 minutos",
    "Anunciá en Boludeando",
  ],
  perWeek: "por semana",
  ariaLabel: (weeklyPrice) => `Anunciá en este espacio por $${weeklyPrice} la semana`,
  uploadIn2Min: "Cargás tu aviso en 2 minutos",
  wantToAdvertise: "Quiero anunciar",
};

const en: AdFallbackCopy = {
  kicker: "This spot is available",
  rotatingLines: [
    "Your brand could be here",
    "Get seen while they play",
    "Perfect for your business",
    "Upload your ad in 2 minutes",
    "Advertise on Boludeando",
  ],
  perWeek: "per week",
  ariaLabel: (weeklyPrice) => `Advertise in this spot for $${weeklyPrice} a week`,
  uploadIn2Min: "Upload your ad in 2 minutes",
  wantToAdvertise: "I want to advertise",
};

const pt: AdFallbackCopy = {
  kicker: "Este espaço está livre",
  rotatingLines: [
    "Sua marca podia estar aqui",
    "Apareça enquanto jogam",
    "Ideal para o seu negócio",
    "Suba seu anúncio em 2 minutos",
    "Anuncie no Boludeando",
  ],
  perWeek: "por semana",
  ariaLabel: (weeklyPrice) => `Anuncie neste espaço por $${weeklyPrice} por semana`,
  uploadIn2Min: "Suba seu anúncio em 2 minutos",
  wantToAdvertise: "Quero anunciar",
};

const COPY: Record<string, AdFallbackCopy> = { es, en, pt };

export function getAdFallbackCopy(locale: string | undefined): AdFallbackCopy {
  return COPY[locale ?? "es"] ?? es;
}
