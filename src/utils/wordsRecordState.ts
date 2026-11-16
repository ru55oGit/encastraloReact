// Récord de la variante "words" — a diferencia de storage.ts (que solo
// guarda un número por variante), acá se guarda la foto completa de la
// MEJOR partida de palabras: además del puntaje, la lista de palabras
// encontradas y la más larga, para mostrarlas en la card de "Récord" del
// Home (y en la imagen de compartir, ver shareImage.ts). Un récord POR
// IDIOMA — el diccionario completo cambia entre es/en/pt, así que mostrar
// (o comparar contra) palabras en español jugando en inglés no tiene
// sentido. Bug real reportado y confirmado: antes era una sola clave
// global, y cambiar de idioma en el Home seguía mostrando el récord del
// idioma anterior.
import { SupportedLanguage } from "../i18n/translations";

const KEY_PREFIX = "encastralo_words_record_";

export interface WordsRecord {
  score: number;
  wordsFound: number;
  longestWord: string;
  words: string[];
}

export function getWordsRecord(lang: SupportedLanguage): WordsRecord | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + lang);
    if (!raw) return null;
    return JSON.parse(raw) as WordsRecord;
  } catch {
    return null;
  }
}

// Solo pisa el récord guardado si esta partida lo supera (o si todavía no
// hay ninguno) — se puede llamar al final de cualquier partida de
// palabras sin chequear antes si corresponde.
export function maybeSaveWordsRecord(score: number, words: string[], lang: SupportedLanguage): WordsRecord {
  const current = getWordsRecord(lang);
  if (current && current.score >= score) return current;

  const longestWord = words.reduce((longest, word) => (word.length > longest.length ? word : longest), "");
  const next: WordsRecord = { score, wordsFound: words.length, longestWord, words };
  try {
    localStorage.setItem(KEY_PREFIX + lang, JSON.stringify(next));
  } catch {
    // localStorage lleno o no disponible: no hay nada razonable que hacer.
  }
  return next;
}
