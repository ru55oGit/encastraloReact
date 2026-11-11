import { describe, expect, it } from "vitest";
import { buildLetterFrequency, buildPrefixTrie } from "./dictionaryIndex";

const SAMPLE = ["SOL", "SOFA", "SOPA"];

describe("buildPrefixTrie", () => {
  it("reconoce todos los prefijos de cada palabra, incluida la palabra entera", () => {
    const trie = buildPrefixTrie(["SOL"]);
    expect(trie.hasPrefix("S")).toBe(true);
    expect(trie.hasPrefix("SO")).toBe(true);
    expect(trie.hasPrefix("SOL")).toBe(true);
  });

  it("comparte prefijos entre varias palabras sin duplicarlos", () => {
    const trie = buildPrefixTrie(SAMPLE);
    expect(trie.hasPrefix("S")).toBe(true);
    expect(trie.hasPrefix("SO")).toBe(true);
    expect(trie.hasPrefix("SOF")).toBe(true);
    expect(trie.hasPrefix("SOFA")).toBe(true);
    expect(trie.hasPrefix("SOP")).toBe(true);
    expect(trie.hasPrefix("SOPA")).toBe(true);
  });

  it("devuelve false para algo que no es prefijo de ninguna palabra", () => {
    const trie = buildPrefixTrie(SAMPLE);
    expect(trie.hasPrefix("X")).toBe(false);
    expect(trie.hasPrefix("SOLX")).toBe(false);
  });
});

describe("buildLetterFrequency", () => {
  it("cuenta cuántas veces aparece cada letra en todo el diccionario", () => {
    const freq = buildLetterFrequency(["SOL", "SOFA"]);
    // SOL: S,O,L — SOFA: S,O,F,A
    expect(freq.S).toBe(2);
    expect(freq.O).toBe(2);
    expect(freq.L).toBe(1);
    expect(freq.F).toBe(1);
    expect(freq.A).toBe(1);
    expect(freq.Z).toBeUndefined();
  });
});
