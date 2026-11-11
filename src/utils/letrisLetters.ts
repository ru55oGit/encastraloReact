import { SupportedLanguage } from "../i18n/translations";

// Pesos aproximados de frecuencia de letras por idioma (no hace falta que
// sean exactos, alcanza con que las vocales y consonantes comunes salgan
// mucho más seguido que la J/K/Q/W/X/Z para que se puedan armar palabras).
const LETTER_WEIGHTS: Record<SupportedLanguage, Record<string, number>> = {
  es: {
    A: 125, E: 137, I: 62, O: 87, U: 39,
    N: 70, R: 69, S: 79, L: 50, D: 50, T: 46, C: 40,
    M: 32, P: 25, B: 14, G: 10, V: 9, Y: 9, Q: 9,
    H: 7, F: 7, Z: 5, J: 4, X: 2, K: 1, W: 1,
  },
  en: {
    A: 82, E: 127, I: 70, O: 75, U: 28,
    N: 67, R: 60, S: 63, T: 91, L: 40, D: 43, C: 28,
    M: 24, P: 19, B: 15, G: 20, V: 10, Y: 20, H: 61,
    F: 22, W: 24, K: 8, J: 2, Q: 1, X: 2, Z: 1,
  },
  pt: {
    A: 146, E: 126, I: 62, O: 107, U: 46,
    N: 50, R: 65, S: 78, T: 43, L: 28, D: 50, C: 39,
    M: 47, P: 25, B: 10, G: 13, V: 17, Y: 1, H: 13,
    F: 10, Q: 12, J: 4, X: 3, Z: 5, K: 1, W: 1,
  },
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildFreshBag(lang: SupportedLanguage): string[] {
  const bag: string[] = [];
  for (const [letter, weight] of Object.entries(LETTER_WEIGHTS[lang])) {
    for (let i = 0; i < weight; i++) bag.push(letter);
  }
  return shuffle(bag);
}

// Bolsa tipo Scrabble en vez de sorteo independiente por celda: cada
// letra se va sacando de un pool que se agota, así ninguna queda
// "hambreada" por mala suerte (con sorteo independiente podías, en
// teoría, no ver una Q en toda la partida). Al vaciarse, se rearma y
// reparte de nuevo.
const bags: Partial<Record<SupportedLanguage, string[]>> = {};

export function randomWeightedLetter(lang: SupportedLanguage): string {
  let bag = bags[lang];
  if (!bag || bag.length === 0) {
    bag = buildFreshBag(lang);
    bags[lang] = bag;
  }
  return bag.pop()!;
}
