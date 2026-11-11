import { describe, expect, it } from "vitest";
import { createEmptyGrid } from "../board";
import { anyPathOf10, numbersVariant } from "./numbers";

function gridWithValues(values: Record<string, number>) {
  const grid = createEmptyGrid();
  for (const key of Object.keys(values)) {
    const [r, c] = key.split(",").map(Number);
    grid[r][c] = values[key];
  }
  return grid;
}

describe("anyPathOf10", () => {
  it("encuentra un camino que suma 10 entre vecinas (incluida diagonal)", () => {
    const grid = gridWithValues({ "0,0": 4, "1,1": 6 }); // diagonal
    expect(anyPathOf10(grid)).toBe(true);
  });

  it("devuelve false si no hay ningún camino posible que sume 10", () => {
    const grid = gridWithValues({ "0,0": 9, "0,1": 9 }); // 9+9=18, y 9 solo no alcanza
    expect(anyPathOf10(grid)).toBe(false);
  });

  it("no cuenta una sola celda que valga 10 (mínimo 2 casillas)", () => {
    // Nunca sale un dígito >9 en el juego real, pero la función igual
    // debe exigir longitud >= 2 aunque el valor por sí solo diera 10.
    const grid = createEmptyGrid();
    grid[0][0] = 10;
    expect(anyPathOf10(grid)).toBe(false);
  });

  it("no reutiliza una celda ya visitada en el mismo camino", () => {
    // 5 -> 5 -> 5 no puede sumar 10 usando la primera celda dos veces;
    // sin poda de visitados esto daría un falso positivo.
    const grid = gridWithValues({ "0,0": 5, "0,1": 5 });
    expect(anyPathOf10(grid)).toBe(true); // 5+5=10 es válido con dos celdas distintas
    const onlyOne = gridWithValues({ "0,0": 5 });
    expect(anyPathOf10(onlyOne)).toBe(false);
  });

  it("poda caminos que ya pasaron 10 (no explota en una grilla grande)", () => {
    const grid = createEmptyGrid().map((row) => row.map(() => 9));
    expect(anyPathOf10(grid)).toBe(false);
  });
});

describe("numbersVariant.resolvePath", () => {
  it("es válido cuando la suma da exactamente 10", () => {
    const grid = gridWithValues({ "0,0": 4, "0,1": 6 });
    const result = numbersVariant.resolvePath(grid, [{ r: 0, c: 0 }, { r: 0, c: 1 }]);
    expect(result.valid).toBe(true);
    // largo(2)*10 + (2-2)*5 = 20
    expect(result.points).toBe(20);
  });

  it("da más puntos de bonus cuantas más casillas tiene el camino", () => {
    const grid = gridWithValues({ "0,0": 1, "0,1": 2, "0,2": 3, "0,3": 4 });
    const result = numbersVariant.resolvePath(grid, [
      { r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 },
    ]);
    expect(result.valid).toBe(true);
    // largo(4)*10 + (4-2)*5 = 50
    expect(result.points).toBe(50);
  });

  it("es inválido si la suma no da 10", () => {
    const grid = gridWithValues({ "0,0": 4, "0,1": 4 });
    const result = numbersVariant.resolvePath(grid, [{ r: 0, c: 0 }, { r: 0, c: 1 }]);
    expect(result.valid).toBe(false);
    expect(result.points).toBe(0);
    expect(result.reasonIfInvalid).toContain("8");
  });
});

describe("numbersVariant.evaluateLivePath", () => {
  it("marca status ok cuando la suma parcial da 10", () => {
    const grid = gridWithValues({ "0,0": 10 });
    // No existe un dígito real de 10, pero evaluateLivePath solo suma lo
    // que haya en la grilla — simula el estado "justo en el objetivo".
    const evalResult = numbersVariant.evaluateLivePath(grid, [{ r: 0, c: 0 }]);
    expect(evalResult.status).toBe("ok");
  });

  it("marca status over cuando ya se pasó de 10", () => {
    const grid = gridWithValues({ "0,0": 9, "0,1": 9 });
    const evalResult = numbersVariant.evaluateLivePath(grid, [{ r: 0, c: 0 }, { r: 0, c: 1 }]);
    expect(evalResult.status).toBe("over");
  });
});
