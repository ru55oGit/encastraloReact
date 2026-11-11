import { describe, expect, it } from "vitest";
import { buildLetterFrequency, buildPrefixSet, buildWordSet, maxWordLength } from "./dictionaryIndex";

const SAMPLE = ["SOL", "SOFA", "SOPA"];

describe("buildWordSet", () => {
  it("contiene exactamente las palabras del diccionario", () => {
    const set = buildWordSet(SAMPLE);
    expect(set.has("SOL")).toBe(true);
    expect(set.has("SO")).toBe(false);
    expect(set.size).toBe(3);
  });
});

describe("buildPrefixSet", () => {
  it("contiene todos los prefijos de cada palabra, incluida la palabra entera", () => {
    const set = buildPrefixSet(["SOL"]);
    expect([...set].sort()).toEqual(["S", "SO", "SOL"]);
  });

  it("no duplica prefijos compartidos entre varias palabras", () => {
    const set = buildPrefixSet(SAMPLE);
    // "S", "SO" son prefijo de las 3 — el Set los guarda una sola vez.
    expect(set.has("S")).toBe(true);
    expect(set.has("SO")).toBe(true);
    expect(set.has("SOL")).toBe(true);
    expect(set.has("SOF")).toBe(true);
    expect(set.has("SOFA")).toBe(true);
    expect(set.has("SOP")).toBe(true);
    expect(set.has("SOPA")).toBe(true);
    // Algo que no es prefijo de ninguna no debería estar.
    expect(set.has("X")).toBe(false);
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

describe("maxWordLength", () => {
  it("devuelve el largo de la palabra más larga", () => {
    expect(maxWordLength(["SOL", "SOFA", "SOPA"])).toBe(4);
  });
});
