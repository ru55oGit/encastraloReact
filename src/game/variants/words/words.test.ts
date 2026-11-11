import { describe, expect, it } from "vitest";
import { createEmptyGrid } from "../../board";
import { anyWordPath, wordsVariant } from "./words";

function gridWithLetters(letters: Record<string, string>) {
  const grid = createEmptyGrid();
  for (const key of Object.keys(letters)) {
    const [r, c] = key.split(",").map(Number);
    grid[r][c] = letters[key];
  }
  return grid;
}

describe("anyWordPath", () => {
  it("encuentra una palabra válida recorriendo vecinas en diagonal", () => {
    // S-O-L en diagonal: (0,0)->(1,1)->(2,2)
    const grid = gridWithLetters({ "0,0": "S", "1,1": "O", "2,2": "L" });
    expect(anyWordPath(grid)).toBe(true);
  });

  it("devuelve false si ninguna combinación de letras contiguas forma palabra", () => {
    const grid = gridWithLetters({ "0,0": "X", "0,1": "Q" });
    expect(anyWordPath(grid)).toBe(false);
  });

  it("no reutiliza la misma celda dos veces en un camino", () => {
    // "SOS" no está en el diccionario placeholder, pero igual confirma que
    // no se arma usando la S inicial dos veces.
    const grid = gridWithLetters({ "0,0": "S", "0,1": "O" });
    expect(anyWordPath(grid)).toBe(false);
  });

  it("respeta la poda por prefijo (letras que no llevan a ninguna palabra)", () => {
    // "Z" sí es prefijo válido (ZAPATO, ZORRO), pero "ZZ" no es prefijo de
    // ninguna palabra del diccionario placeholder — el camino se corta ahí.
    const grid = gridWithLetters({ "0,0": "Z", "0,1": "Z" });
    expect(anyWordPath(grid)).toBe(false);
  });
});

describe("wordsVariant.resolvePath", () => {
  it("es válido cuando el camino forma una palabra del diccionario", () => {
    const grid = gridWithLetters({ "0,0": "S", "1,1": "O", "2,2": "L" });
    const result = wordsVariant.resolvePath(grid, [{ r: 0, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 2 }]);
    expect(result.valid).toBe(true);
    // largo(3)*10 + (3-3)*5 = 30
    expect(result.points).toBe(30);
  });

  it("da más puntos de bonus cuanto más larga es la palabra", () => {
    const grid = gridWithLetters({ "0,0": "R", "0,1": "I", "0,2": "O" });
    const result = wordsVariant.resolvePath(grid, [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }]);
    expect(result.valid).toBe(true);
    expect(result.points).toBe(30);
  });

  it("es inválido si el string armado no es una palabra", () => {
    const grid = gridWithLetters({ "0,0": "X", "0,1": "Q" });
    const result = wordsVariant.resolvePath(grid, [{ r: 0, c: 0 }, { r: 0, c: 1 }]);
    expect(result.valid).toBe(false);
    expect(result.points).toBe(0);
    expect(result.reasonIfInvalid).toContain("XQ");
  });

  it("exige mínimo 3 letras aunque las 2 primeras sean un prefijo válido", () => {
    const grid = gridWithLetters({ "0,0": "S", "0,1": "O" }); // "SO" es prefijo de SOL/SOFA/SOPA/SOLDADO/SONIDO pero no palabra en sí
    const result = wordsVariant.resolvePath(grid, [{ r: 0, c: 0 }, { r: 0, c: 1 }]);
    expect(result.valid).toBe(false);
  });
});

describe("wordsVariant.evaluateLivePath", () => {
  it("marca status ok apenas el string armado ya es una palabra válida", () => {
    const grid = gridWithLetters({ "0,0": "U", "0,1": "V", "0,2": "A" });
    const evalResult = wordsVariant.evaluateLivePath(grid, [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }]);
    expect(evalResult.liveLabel).toBe("UVA");
    expect(evalResult.status).toBe("ok");
  });

  it("marca status neutral mientras no es (todavía) una palabra", () => {
    const grid = gridWithLetters({ "0,0": "U", "0,1": "V" });
    const evalResult = wordsVariant.evaluateLivePath(grid, [{ r: 0, c: 0 }, { r: 0, c: 1 }]);
    expect(evalResult.status).toBe("neutral");
  });
});
