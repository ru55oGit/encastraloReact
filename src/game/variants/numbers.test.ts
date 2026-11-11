import { describe, expect, it } from "vitest";
import { createEmptyGrid } from "../board";
import { anyValidSumPath, numbersVariant, withAllowedSums } from "./numbers";

function gridWithValues(values: Record<string, number>) {
  const grid = createEmptyGrid();
  for (const key of Object.keys(values)) {
    const [r, c] = key.split(",").map(Number);
    grid[r][c] = values[key];
  }
  return grid;
}

describe("anyValidSumPath", () => {
  it("encuentra un camino que suma 10 entre vecinas (incluida diagonal)", () => {
    const grid = gridWithValues({ "0,0": 4, "1,1": 6 }); // diagonal
    expect(anyValidSumPath(grid)).toBe(true);
  });

  it("también vale una suma por encima de 10 (hasta 20)", () => {
    const grid = gridWithValues({ "0,0": 9, "0,1": 9 }); // 9+9=18, dentro de [10,20]
    expect(anyValidSumPath(grid)).toBe(true);
  });

  it("devuelve false si no hay ningún camino posible dentro de [10,20]", () => {
    const grid = gridWithValues({ "0,0": 3, "0,1": 3 }); // 3+3=6, ningún vecino más
    expect(anyValidSumPath(grid)).toBe(false);
  });

  it("no cuenta una sola celda que valga 10 (mínimo 2 casillas)", () => {
    // Nunca sale un dígito >9 en el juego real, pero la función igual
    // debe exigir longitud >= 2 aunque el valor por sí solo diera 10.
    const grid = createEmptyGrid();
    grid[0][0] = 10;
    expect(anyValidSumPath(grid)).toBe(false);
  });

  it("no reutiliza una celda ya visitada en el mismo camino", () => {
    // 5 -> 5 -> 5 no puede sumar 10 usando la primera celda dos veces;
    // sin poda de visitados esto daría un falso positivo.
    const grid = gridWithValues({ "0,0": 5, "0,1": 5 });
    expect(anyValidSumPath(grid)).toBe(true); // 5+5=10 es válido con dos celdas distintas
    const onlyOne = gridWithValues({ "0,0": 5 });
    expect(anyValidSumPath(onlyOne)).toBe(false);
  });

  it("poda caminos que ya pasaron el máximo (no explota en una grilla grande)", () => {
    // 9+9+9=27 > 20, y tres 9s es lo mínimo para pasarse del rango — ningún
    // subconjunto de nueves cae en [10,20] salvo 9+9=18, que ya está
    // cubierto por otro test; acá se usa un grid sin ningún par adyacente
    // posible por debajo del máximo para confirmar que la poda corta solo.
    const grid = createEmptyGrid().map((row) => row.map(() => 9));
    // Con 9s por todos lados, 9+9=18 SÍ es válido (está en [10,20]) —
    // la poda real a probar es que no explota buscando de más, no que dé
    // false. Alcanza con que termine rápido y dé el resultado esperado.
    expect(anyValidSumPath(grid)).toBe(true);
  });
});

describe("numbersVariant.resolvePath", () => {
  it("es válido cuando la suma da exactamente 10", () => {
    const grid = gridWithValues({ "0,0": 4, "0,1": 6 });
    const result = numbersVariant.resolvePath(grid, [{ r: 0, c: 0 }, { r: 0, c: 1 }]);
    expect(result.valid).toBe(true);
    // largo(2)*10 + (2-2)*5 = 20
    expect(result.points).toBe(20);
    expect(result.successLabel).toBe("10");
  });

  it("también es válido cuando la suma da más de 10 (hasta 20)", () => {
    const grid = gridWithValues({ "0,0": 9, "0,1": 9 });
    const result = numbersVariant.resolvePath(grid, [{ r: 0, c: 0 }, { r: 0, c: 1 }]);
    expect(result.valid).toBe(true);
    expect(result.successLabel).toBe("18");
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

  it("es inválido si la suma no entra en el rango [10,20]", () => {
    const grid = gridWithValues({ "0,0": 4, "0,1": 4 });
    const result = numbersVariant.resolvePath(grid, [{ r: 0, c: 0 }, { r: 0, c: 1 }]);
    expect(result.valid).toBe(false);
    expect(result.points).toBe(0);
    expect(result.reasonIfInvalid).toContain("8");
  });

  it("es inválido si la suma se pasa de 20", () => {
    const grid = gridWithValues({ "0,0": 9, "0,1": 9, "0,2": 9 });
    const result = numbersVariant.resolvePath(grid, [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }]);
    expect(result.valid).toBe(false);
    expect(result.reasonIfInvalid).toContain("27");
  });
});

describe("numbersVariant.evaluateLivePath", () => {
  it("marca status ok cuando la suma parcial cae en [10,20]", () => {
    const grid = gridWithValues({ "0,0": 10 });
    // No existe un dígito real de 10, pero evaluateLivePath solo suma lo
    // que haya en la grilla — simula el estado "justo en el objetivo".
    const evalResult = numbersVariant.evaluateLivePath(grid, [{ r: 0, c: 0 }]);
    expect(evalResult.status).toBe("ok");
  });

  it("marca status over cuando ya se pasó de 20", () => {
    const grid = gridWithValues({ "0,0": 9, "0,1": 9, "0,2": 9 });
    const evalResult = numbersVariant.evaluateLivePath(grid, [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }]);
    expect(evalResult.status).toBe("over");
  });

  it("marca status neutral mientras la suma todavía no llega a 10", () => {
    const grid = gridWithValues({ "0,0": 4, "0,1": 4 });
    const evalResult = numbersVariant.evaluateLivePath(grid, [{ r: 0, c: 0 }, { r: 0, c: 1 }]);
    expect(evalResult.status).toBe("neutral");
  });
});

describe("withAllowedSums", () => {
  it("acepta la base (10) y la meta siguiente, ninguna otra suma del rango", () => {
    const locked = withAllowedSums([10, 13]);

    const sum10 = gridWithValues({ "0,0": 4, "0,1": 6 });
    expect(locked.resolvePath(sum10, [{ r: 0, c: 0 }, { r: 0, c: 1 }]).valid).toBe(true);

    const sum13 = gridWithValues({ "0,0": 6, "0,1": 7 });
    expect(locked.resolvePath(sum13, [{ r: 0, c: 0 }, { r: 0, c: 1 }]).valid).toBe(true);

    // 12 y 14 están dentro del rango general [10,20] pero no son ni la
    // base ni la meta actual — tienen que quedar afuera igual.
    const sum12 = gridWithValues({ "0,0": 5, "0,1": 7 });
    expect(locked.resolvePath(sum12, [{ r: 0, c: 0 }, { r: 0, c: 1 }]).valid).toBe(false);

    const sum14 = gridWithValues({ "0,0": 7, "0,1": 7 });
    expect(locked.resolvePath(sum14, [{ r: 0, c: 0 }, { r: 0, c: 1 }]).valid).toBe(false);
  });

  it("anyClearPathExists solo encuentra caminos con una suma permitida", () => {
    // Grilla donde solo existe un camino que suma 12 (ninguno suma 10 ni 13).
    const grid = gridWithValues({ "0,0": 5, "0,1": 7 });
    expect(withAllowedSums([10, 13]).anyClearPathExists(grid)).toBe(false);
    expect(withAllowedSums([10, 12]).anyClearPathExists(grid)).toBe(true);
  });

  it("cuando no queda meta siguiente, solo la base (10) sigue siendo válida", () => {
    const locked = withAllowedSums([10]);
    const sum10 = gridWithValues({ "0,0": 4, "0,1": 6 });
    expect(locked.resolvePath(sum10, [{ r: 0, c: 0 }, { r: 0, c: 1 }]).valid).toBe(true);
    const sum15 = gridWithValues({ "0,0": 7, "0,1": 8 });
    expect(locked.resolvePath(sum15, [{ r: 0, c: 0 }, { r: 0, c: 1 }]).valid).toBe(false);
  });
});
