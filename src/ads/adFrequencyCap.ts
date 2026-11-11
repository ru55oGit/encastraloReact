// Copiado de boludeando-ads/sdk/boludeando-ads-client/src/adFrequencyCap.ts el 2026-10-05.
// Si cambia la API del backend, actualizar acá y en el resto de los juegos a mano.
// Mismo patrón que failLockout.ts: una clave de localStorage por slot,
// guardando un timestamp absoluto (no un contador), funciones planas.
// Evita que alguien dispare el mismo rewarded ad en loop para explotar la
// recompensa — no es anti-fraude robusto, es un freno razonable para el
// tamaño de este proyecto.
const COOLDOWN_MS = 30 * 1000;

function keyFor(slot: string): string {
  return `boludeando_ad_cooldown_${slot}`;
}

export function getCooldownRemainingSeconds(slot: string): number {
  const raw = localStorage.getItem(keyFor(slot));
  if (!raw) return 0;

  const remainingMs = Number(raw) - Date.now();
  if (remainingMs <= 0) {
    localStorage.removeItem(keyFor(slot));
    return 0;
  }
  return Math.ceil(remainingMs / 1000);
}

export function setCooldown(slot: string): void {
  localStorage.setItem(keyFor(slot), String(Date.now() + COOLDOWN_MS));
}
