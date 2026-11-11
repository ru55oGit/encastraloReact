// Récord de la variante "words" — a diferencia de storage.ts (que solo
// guarda un número por variante), acá se guarda la foto completa de la
// MEJOR partida de palabras: además del puntaje, la lista de palabras
// encontradas y la más larga, para mostrarlas en la card de "Récord" del
// Home (y en la imagen de compartir, ver shareImage.ts).

const KEY = "encastralo_words_record";

export interface WordsRecord {
  score: number;
  wordsFound: number;
  longestWord: string;
  words: string[];
}

export function getWordsRecord(): WordsRecord | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WordsRecord;
  } catch {
    return null;
  }
}

// Solo pisa el récord guardado si esta partida lo supera (o si todavía no
// hay ninguno) — se puede llamar al final de cualquier partida de
// palabras sin chequear antes si corresponde.
export function maybeSaveWordsRecord(score: number, words: string[]): WordsRecord {
  const current = getWordsRecord();
  if (current && current.score >= score) return current;

  const longestWord = words.reduce((longest, word) => (word.length > longest.length ? word : longest), "");
  const next: WordsRecord = { score, wordsFound: words.length, longestWord, words };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage lleno o no disponible: no hay nada razonable que hacer.
  }
  return next;
}
