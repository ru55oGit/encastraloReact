import { Variant } from "../game/types";

const KEY_PREFIX = "encastrado_best";

function keyFor(variant: Variant): string {
  return `${KEY_PREFIX}_${variant}`;
}

export function getBest(variant: Variant): number {
  try {
    return Number(localStorage.getItem(keyFor(variant))) || 0;
  } catch {
    return 0;
  }
}

export function setBest(variant: Variant, value: number): void {
  try {
    localStorage.setItem(keyFor(variant), String(value));
  } catch {
    // localStorage lleno o no disponible: no hay nada razonable que hacer.
  }
}
