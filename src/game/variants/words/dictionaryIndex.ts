// Builders puros a partir de un conjunto de palabras (en mayúsculas, sin
// tildes) — ver src/data/dictionaries.ts para cómo se arma ese conjunto
// unificado por idioma (el mismo que usan los demás juegos del hub).

interface TrieNode {
  children: Map<string, TrieNode>;
}

export interface PrefixTrie {
  hasPrefix(prefix: string): boolean;
}

// anyWordPath usa esto para cortar un camino apenas deja de poder llevar a
// ninguna palabra del diccionario, en vez de explorar el tablero entero
// letra por letra. Un Trie (no un Set con todos los prefijos de todas las
// palabras, como en la versión placeholder) porque con los diccionarios
// reales del hub (cientos de miles de palabras) ese Set sería enorme — el
// Trie comparte la memoria de los prefijos repetidos entre palabras.
export function buildPrefixTrie(words: Iterable<string>): PrefixTrie {
  const root: TrieNode = { children: new Map() };
  for (const word of words) {
    let node = root;
    for (const letter of word) {
      let next = node.children.get(letter);
      if (!next) {
        next = { children: new Map() };
        node.children.set(letter, next);
      }
      node = next;
    }
  }

  return {
    hasPrefix(prefix: string): boolean {
      let node = root;
      for (const letter of prefix) {
        const next = node.children.get(letter);
        if (!next) return false;
        node = next;
      }
      return true;
    },
  };
}

// Frecuencia real de cada letra dentro del diccionario — así el tablero
// nunca saca una letra que no sirva para ninguna palabra, y las letras
// más comunes (A, E...) salen más seguido que las raras (de forma
// proporcional a cuánto se usan de verdad).
export function buildLetterFrequency(words: Iterable<string>): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const word of words) {
    for (const letter of word) freq[letter] = (freq[letter] ?? 0) + 1;
  }
  return freq;
}
