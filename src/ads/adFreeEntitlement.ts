// Copiado de boludeando-ads/sdk/boludeando-ads-client/src/adFreeEntitlement.ts el 2026-10-05.
// Si cambia la API del backend, actualizar acá y en el resto de los juegos a mano.
import { getAdSessionId } from "./adSessionId";

const API_BASE = "https://ads-api.boludeando.com/api";

// Cache en memoria del proceso (no localStorage): un flag local se edita en
// 10 segundos desde devtools, así que cada chequeo real confirma contra el
// servidor. El cache evita pegarle a la API en cada render, no reemplaza
// la verificación de red.
let cachedActive: boolean | null = null;

export async function isAdFree(): Promise<boolean> {
  if (cachedActive !== null) return cachedActive;
  try {
    const device = getAdSessionId();
    const res = await fetch(`${API_BASE}/entitlements/status?device=${encodeURIComponent(device)}`);
    if (!res.ok) return false;
    const data = (await res.json()) as { active: boolean };
    cachedActive = data.active;
    return data.active;
  } catch {
    return false;
  }
}

// Devuelve la URL de checkout de MercadoPago, o null si falló. El llamador
// hace la redirección (window.location.href = url).
export async function purchaseAdFree(returnUrl: string): Promise<string | null> {
  try {
    const device = getAdSessionId();
    const res = await fetch(`${API_BASE}/entitlements/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device, returnUrl }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { checkoutUrl: string };
    return data.checkoutUrl;
  } catch {
    return null;
  }
}

// Respaldo por si el webhook de MP no llega: el juego anfitrión la llama
// una vez al volver del checkout (ver returnUrl pasada a purchaseAdFree),
// vuelve a preguntarle a MP el estado real en vez de esperar la notificación.
export async function syncAdFreeAfterReturn(): Promise<boolean> {
  try {
    const device = getAdSessionId();
    const res = await fetch(`${API_BASE}/entitlements/sync?device=${encodeURIComponent(device)}`);
    if (!res.ok) return false;
    const data = (await res.json()) as { active: boolean };
    cachedActive = data.active;
    return data.active;
  } catch {
    return false;
  }
}
