// Builders puros a partir de un diccionario (array de strings en
// mayúsculas, sin tildes) — así dictionary.ts se puede reemplazar entero
// sin tocar nada de esta lógica (ver README).

export function buildWordSet(dictionary: string[]): Set<string> {
  return new Set(dictionary);
}

// Todos los prefijos de todas las palabras ("ABEJA" -> "A","AB","ABE",
// "ABEJ","ABEJA"). anyWordPath usa esto para cortar un camino apenas deja
// de poder llevar a ninguna palabra del diccionario, en vez de explorar
// el tablero entero letra por letra.
export function buildPrefixSet(dictionary: string[]): Set<string> {
  const prefixes = new Set<string>();
  for (const word of dictionary) {
    for (let i = 1; i <= word.length; i++) prefixes.add(word.slice(0, i));
  }
  return prefixes;
}

// Frecuencia real de cada letra dentro del diccionario — así el tablero
// nunca saca una letra que no sirva para ninguna palabra, y las letras
// más comunes (A, E...) salen más seguido que las raras (de forma
// proporcional a cuánto se usan de verdad).
export function buildLetterFrequency(dictionary: string[]): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const word of dictionary) {
    for (const letter of word) freq[letter] = (freq[letter] ?? 0) + 1;
  }
  return freq;
}

export function maxWordLength(dictionary: string[]): number {
  return Math.max(...dictionary.map((word) => word.length));
}
