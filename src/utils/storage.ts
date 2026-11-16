import { Variant } from "../game/types";

const KEY_PREFIX = "encastralo_best";

// `scope` solo lo usa "words" (pasa el idioma) — el diccionario cambia por
// completo entre es/en/pt, así que "el mejor puntaje" de una partida en
// español no tiene sentido comparado/mostrado jugando en inglés. Números y
// frutas no dependen del idioma, así que siguen sin scope.
function keyFor(variant: Variant, scope?: string): string {
  return `${KEY_PREFIX}_${variant}${scope ? `_${scope}` : ""}`;
}

export function getBest(variant: Variant, scope?: string): number {
  try {
    return Number(localStorage.getItem(keyFor(variant, scope))) || 0;
  } catch {
    return 0;
  }
}

export function setBest(variant: Variant, value: number, scope?: string): void {
  try {
    localStorage.setItem(keyFor(variant, scope), String(value));
  } catch {
    // localStorage lleno o no disponible: no hay nada razonable que hacer.
  }
}
