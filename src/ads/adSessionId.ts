// Copiado de boludeando-ads/sdk/boludeando-ads-client/src/adSessionId.ts el 2026-10-05.
// Si cambia la API del backend, actualizar acá y en el resto de los juegos a mano.
// Mismo patrón que failLockout.ts/debugUnlock.ts: una sola clave de
// localStorage, funciones planas get/set, sin clases. UUID anónimo, no
// identifica a la persona, solo agrupa eventos de una misma sesión de
// navegador para métricas básicas.
const AD_SESSION_ID_KEY = "boludeando_ad_session_id";

export function getAdSessionId(): string {
  const existing = localStorage.getItem(AD_SESSION_ID_KEY);
  if (existing) return existing;

  const fresh =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  localStorage.setItem(AD_SESSION_ID_KEY, fresh);
  return fresh;
}
