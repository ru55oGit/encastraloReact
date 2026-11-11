// Guarda la partida en curso de cada variante por separado, para que si
// el jugador se va y vuelve (o recarga) retome donde estaba, en vez de
// arrancar una nueva — se borra en cuanto esa partida termina (gameover)
// o cuando se reinicia manualmente, nunca sobrevive más allá de "perder".

import { ColorGrid, Grid, Piece, Variant } from "../game/types";
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
}

function keyFor(variant: Variant): string {
  return `encastralo_inprogress_${variant}`;
}

export function saveInProgressGame(variant: Variant, snapshot: InProgressGame): void {
  try {
    localStorage.setItem(keyFor(variant), JSON.stringify(snapshot));
  } catch {
    // localStorage lleno o no disponible: no hay nada razonable que hacer.
  }
}

export function loadInProgressGame(variant: Variant): InProgressGame | null {
  try {
    const raw = localStorage.getItem(keyFor(variant));
    if (!raw) return null;
    return JSON.parse(raw) as InProgressGame;
  } catch {
    return null;
  }
}

export function clearInProgressGame(variant: Variant): void {
  try {
    localStorage.removeItem(keyFor(variant));
  } catch {
    // no-op
  }
}
