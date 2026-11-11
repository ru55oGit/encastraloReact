import { DIRECTIONS_8, GRID_SIZE, HINTS, MIN_PATH_LENGTH_WORDS } from "../../constants";
import { Grid, Path, PathEvaluation, PathResult, VariantEngine } from "../../types";
import { DICTIONARY } from "./dictionary";
import { buildLetterFrequency, buildPrefixSet, buildWordSet, maxWordLength } from "./dictionaryIndex";

const WORD_SET = buildWordSet(DICTIONARY);
const PREFIX_SET = buildPrefixSet(DICTIONARY);
const LETTER_FREQUENCY = buildLetterFrequency(DICTIONARY);
const LETTERS = Object.keys(LETTER_FREQUENCY);
const MAX_WORD_LENGTH = maxWordLength(DICTIONARY);

// Ponderada por frecuencia real dentro del diccionario (ver
// dictionaryIndex.ts) — nunca sale una letra que no sirva para ninguna
// palabra.
export function randLetter(): string {
  const total = LETTERS.reduce((sum, letter) => sum + LETTER_FREQUENCY[letter], 0);
  let x = Math.random() * total;
  for (const letter of LETTERS) {
    x -= LETTER_FREQUENCY[letter];
    if (x < 0) return letter;
  }
  return LETTERS[0];
}

export function pathWord(grid: Grid, path: Path): string {
  return path.map(({ r, c }) => grid[r][c] as string).join("");
}

function isValidWord(word: string): boolean {
  return word.length >= MIN_PATH_LENGTH_WORDS && WORD_SET.has(word);
}

function evaluateLivePath(grid: Grid, path: Path): PathEvaluation {
  const word = pathWord(grid, path);
  return { liveLabel: word, status: isValidWord(word) ? "ok" : "neutral" };
}

function scoreForPath(length: number): number {
  return length * 10 + (length - MIN_PATH_LENGTH_WORDS) * 5;
}

function resolvePath(grid: Grid, path: Path): PathResult {
  const word = pathWord(grid, path);
  if (!isValidWord(word)) {
    return { valid: false, points: 0, reasonIfInvalid: `<b>${word}</b> no es una palabra` };
  }
  return { valid: true, points: scoreForPath(word.length), successLabel: word };
}

// ¿Existe algún recorrido de letras contiguas (8 direcciones) que forme
// una palabra del diccionario? DFS con poda por prefijos: si el string
// armado hasta ahora no es prefijo de ninguna palabra, ese camino no
// puede llevar a nada y se corta ahí.
export function anyWordPath(grid: Grid): boolean {
  const seen = new Set<number>();

  function dfs(r: number, c: number, word: string): boolean {
    if (isValidWord(word)) return true;
    if (word.length >= MAX_WORD_LENGTH) return false;
    for (const { r: dr, c: dc } of DIRECTIONS_8) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;
      const value = grid[nr][nc];
      if (value === null) continue;
      const key = nr * GRID_SIZE + nc;
      if (seen.has(key)) continue;
      const nextWord = word + (value as string);
      if (!PREFIX_SET.has(nextWord)) continue;
      seen.add(key);
      const found = dfs(nr, nc, nextWord);
      seen.delete(key);
      if (found) return true;
    }
    return false;
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const value = grid[r][c];
      if (value === null) continue;
      const key = r * GRID_SIZE + c;
      seen.add(key);
      const found = dfs(r, c, value as string);
      seen.delete(key);
      if (found) return true;
    }
  }
  return false;
}

export const wordsVariant: VariantEngine = {
  id: "words",
  hint: HINTS.words,
  minPathLength: MIN_PATH_LENGTH_WORDS,
  randomValue: randLetter,
  cellLabel: (value) => value as string,
  evaluateLivePath,
  resolvePath,
  anyClearPathExists: anyWordPath,
};
