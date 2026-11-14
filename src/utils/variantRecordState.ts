// Récord de "mejor partida" para números y frutas — mismo concepto que
// wordsRecordState.ts (una foto completa de la mejor partida, no solo el
// puntaje simple que ya guarda storage.ts para el chequeo de "nuevo
// récord" en vivo) pero con un solo dato destacado en vez de una lista de
// palabras: la meta más alta sumada en números, el grupo más grande
// juntado de una sola vez en frutas.

const KEY_PREFIX = "encastralo_run_record";

export interface VariantRunRecord {
  score: number;
  highlight: number;
  clears: number;
}

function keyFor(variant: "numbers" | "fruits"): string {
  return `${KEY_PREFIX}_${variant}`;
}

export function getVariantRecord(variant: "numbers" | "fruits"): VariantRunRecord | null {
  try {
    const raw = localStorage.getItem(keyFor(variant));
    if (!raw) return null;
    return JSON.parse(raw) as VariantRunRecord;
  } catch {
    return null;
  }
}

// Solo pisa el récord guardado si esta partida lo supera (o si todavía no
// hay ninguno) — se puede llamar al final de cualquier partida sin
// chequear antes si corresponde.
export function maybeSaveVariantRecord(
  variant: "numbers" | "fruits",
  score: number,
  highlight: number,
  clears: number,
): VariantRunRecord {
  const current = getVariantRecord(variant);
  if (current && current.score >= score) return current;

  const next: VariantRunRecord = { score, highlight, clears };
  try {
    localStorage.setItem(keyFor(variant), JSON.stringify(next));
  } catch {
    // localStorage lleno o no disponible: no hay nada razonable que hacer.
  }
  return next;
}
