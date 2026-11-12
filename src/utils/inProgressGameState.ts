// Guarda la partida en curso de cada variante POR IDIOMA por separado, para
// que si el jugador se va y vuelve (o recarga) retome donde estaba, en vez
// de arrancar una nueva — se borra en cuanto esa partida termina (gameover)
// o cuando se reinicia manualmente, nunca sobrevive más allá de "perder".
//
// El idioma entra en la clave porque "words" depende del diccionario activo
// (una grilla llena de letras en español no tiene sentido si el jugador
// cambió a inglés): cambiar de idioma no debe resumir esa partida vieja,
// tiene que arrancar una nueva en el idioma elegido — la partida en el
// idioma anterior queda guardada aparte, lista si vuelve a cambiar. Mismo
// criterio aplicado a números/frutas por consistencia, aunque esas dos no
// dependan del idioma.

import { ColorGrid, Grid, Piece, Variant } from "../game/types";
import { SupportedLanguage } from "../i18n/translations";
import { FoundWordEntry } from "../components/FoundWordsList";

export interface InProgressGame {
  grid: Grid;
  colorGrid: ColorGrid;
  tray: (Piece | null)[];
  score: number;
  // Solo tiene contenido real en la variante correspondiente — las otras
  // dos quedan en su valor por default (array vacío / piso base), pero se
  // guardan igual para no tener que tipar un union por variante acá.
  foundWords: FoundWordEntry[];
  numberFloor: number;
  fruitFloor: number;
  // Tiempo restante en ms — se guarda tal cual (no una marca de tiempo
  // absoluta): irse y volver más tarde no debe descontar el tiempo que
  // estuvo cerrado, el reloj tiene que quedar pausado mientras tanto.
  remainingMs: number;
}

function keyFor(variant: Variant, lang: SupportedLanguage): string {
  return `encastralo_inprogress_${variant}_${lang}`;
}

export function saveInProgressGame(variant: Variant, lang: SupportedLanguage, snapshot: InProgressGame): void {
  try {
    localStorage.setItem(keyFor(variant, lang), JSON.stringify(snapshot));
  } catch {
    // localStorage lleno o no disponible: no hay nada razonable que hacer.
  }
}

export function loadInProgressGame(variant: Variant, lang: SupportedLanguage): InProgressGame | null {
  try {
    const raw = localStorage.getItem(keyFor(variant, lang));
    if (!raw) return null;
    return JSON.parse(raw) as InProgressGame;
  } catch {
    return null;
  }
}

export function clearInProgressGame(variant: Variant, lang: SupportedLanguage): void {
  try {
    localStorage.removeItem(keyFor(variant, lang));
  } catch {
    // no-op
  }
}
