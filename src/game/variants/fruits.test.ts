import { describe, expect, it } from "vitest";
import { createEmptyGrid } from "../board";
import { anyMatchPath, fruitsVariant } from "./fruits";

function gridWithFruits(values: Record<string, string>) {
  const grid = createEmptyGrid();
  for (const key of Object.keys(values)) {
    const [r, c] = key.split(",").map(Number);
    grid[r][c] = values[key];
  }
  return grid;
}

describe("anyMatchPath", () => {
  it("encuentra un grupo de 3 o más frutas iguales contiguas", () => {
    const grid = gridWithFruits({ "0,0": "🍎", "0,1": "🍎", "1,1": "🍎" }); // L conectada
    expect(anyMatchPath(grid)).toBe(true);
  });

  it("devuelve false si ningún grupo llega a 3", () => {
    const grid = gridWithFruits({ "0,0": "🍎", "0,1": "🍎", "5,5": "🍌" });
    expect(anyMatchPath(grid)).toBe(false);
  });

  it("no cuenta frutas iguales que no están conectadas", () => {
    // Dos pares de 2 separados, ninguno llega a 3 por sí solo.
    const grid = gridWithFruits({ "0,0": "🍎", "0,1": "🍎", "6,6": "🍎", "6,7": "🍎" });
    expect(anyMatchPath(grid)).toBe(false);
  });

  it("conecta en diagonal", () => {
    const grid = gridWithFruits({ "0,0": "🍊", "1,1": "🍊", "2,2": "🍊" });
    expect(anyMatchPath(grid)).toBe(true);
  });
});

describe("fruitsVariant.resolvePath", () => {
  it("es válido con 3 o más frutas iguales", () => {
    const grid = gridWithFruits({ "0,0": "🍎", "0,1": "🍎", "0,2": "🍎" });
    const result = fruitsVariant.resolvePath(grid, [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }]);
    expect(result.valid).toBe(true);
    // largo(3)*10 + (3-3)*5 = 30
    expect(result.points).toBe(30);
  });

  it("es inválido con menos de 3 frutas", () => {
    const grid = gridWithFruits({ "0,0": "🍎", "0,1": "🍎" });
    const result = fruitsVariant.resolvePath(grid, [{ r: 0, c: 0 }, { r: 0, c: 1 }]);
    expect(result.valid).toBe(false);
    expect(result.points).toBe(0);
  });

  it("es inválido si las frutas no son todas iguales", () => {
    const grid = gridWithFruits({ "0,0": "🍎", "0,1": "🍌", "0,2": "🍎" });
    const result = fruitsVariant.resolvePath(grid, [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }]);
    expect(result.valid).toBe(false);
    expect(result.reasonIfInvalid).toContain("misma fruta");
  });

  it("también es válido con un grupo más grande (cualquier cantidad sirve)", () => {
    const grid = gridWithFruits({ "0,0": "🍎", "0,1": "🍎", "0,2": "🍎", "0,3": "🍎", "0,4": "🍎", "0,5": "🍎" });
    const path = [
      { r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 }, { r: 0, c: 4 }, { r: 0, c: 5 },
    ];
    const result = fruitsVariant.resolvePath(grid, path);
    expect(result.valid).toBe(true);
    expect(result.successLabel).toBe("6");
  });
});
