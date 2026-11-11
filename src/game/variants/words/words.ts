import { WORD_SETS } from "../../../data/dictionaries";
import { SupportedLanguage } from "../../../i18n/translations";
import { DIRECTIONS_8, GRID_SIZE, HINTS, MIN_PATH_LENGTH_WORDS } from "../../constants";
import { Grid, Path, PathEvaluation, PathResult, VariantEngine } from "../../types";
import { buildLetterFrequency, buildPrefixTrie, PrefixTrie } from "./dictionaryIndex";

interface WordsLangData {
  wordSet: Set<string>;
  trie: PrefixTrie;
  letters: string[];
  letterFrequency: Record<string, number>;
}

// Los 3 diccionarios (es/en/pt) son el mismo WORD_SETS que ya usan los
// demás juegos del hub (ver src/data/dictionaries.ts) — acá solo se deriva
// el Trie de prefijos y la frecuencia de letras, cacheados por idioma para
// no reconstruirlos en cada partida.
const langDataCache = new Map<SupportedLanguage, WordsLangData>();

function getLangData(lang: SupportedLanguage): WordsLangData {
  let data = langDataCache.get(lang);
  if (!data) {
    const wordSet = WORD_SETS[lang];
    data = {
      wordSet,
      trie: buildPrefixTrie(wordSet),
      letterFrequency: buildLetterFrequency(wordSet),
      letters: [],
    };
    data.letters = Object.keys(data.letterFrequency);
    langDataCache.set(lang, data);
  }
  return data;
}

export function pathWord(grid: Grid, path: Path): string {
  return path.map(({ r, c }) => grid[r][c] as string).join("");
}

function buildWordsVariant(lang: SupportedLanguage): VariantEngine {
  const { wordSet, trie, letters, letterFrequency } = getLangData(lang);

  // Ponderada por frecuencia real dentro del diccionario — nunca sale una
  // letra que no sirva para ninguna palabra.
  function randLetter(): string {
    const total = letters.reduce((sum, letter) => sum + letterFrequency[letter], 0);
    let x = Math.random() * total;
    for (const letter of letters) {
      x -= letterFrequency[letter];
      if (x < 0) return letter;
    }
    return letters[0];
  }

  function isValidWord(word: string): boolean {
    return word.length >= MIN_PATH_LENGTH_WORDS && wordSet.has(word);
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
  // una palabra del diccionario? DFS podado por el Trie de prefijos: si el
  // string armado hasta ahora no es prefijo de ninguna palabra, ese camino
  // no puede llevar a nada y se corta ahí mismo (sin esto, con
  // diccionarios reales de cientos de miles de palabras, explorar a
  // ciegas sería impracticable).
  function anyWordPath(grid: Grid): boolean {
    const seen = new Set<number>();

    function dfs(r: number, c: number, word: string): boolean {
      if (isValidWord(word)) return true;
      for (const { r: dr, c: dc } of DIRECTIONS_8) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;
        const value = grid[nr][nc];
        if (value === null) continue;
        const key = nr * GRID_SIZE + nc;
        if (seen.has(key)) continue;
        const nextWord = word + (value as string);
        if (!trie.hasPrefix(nextWord)) continue;
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

  return {
    id: "words",
    hint: HINTS.words,
    minPathLength: MIN_PATH_LENGTH_WORDS,
    randomValue: randLetter,
    cellLabel: (value) => value as string,
    evaluateLivePath,
    resolvePath,
    anyClearPathExists: anyWordPath,
  };
}

const engineCache = new Map<SupportedLanguage, VariantEngine>();

// Lazy a propósito: construir el Trie de un idioma entero (~600k palabras
// en español) tarda ~300ms — nadie debería pagar ese costo al abrir
// Encastralo si va a jugar números o frutas, solo quien elige palabras.
export function getWordsVariant(lang: SupportedLanguage): VariantEngine {
  let engine = engineCache.get(lang);
  if (!engine) {
    engine = buildWordsVariant(lang);
    engineCache.set(lang, engine);
  }
  return engine;
}
