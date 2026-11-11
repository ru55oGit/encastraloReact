import { describe, expect, it } from "vitest";
import { createEmptyGrid } from "./board";
import { stepPath } from "./pathBuilder";

function gridWithValues(values: Record<string, number>) {
  const grid = createEmptyGrid();
  for (const key of Object.keys(values)) {
    const [r, c] = key.split(",").map(Number);
    grid[r][c] = values[key];
  }
  return grid;
}

describe("stepPath", () => {
  it("agrega una vecina (8 direcciones) no visitada", () => {
    const grid = gridWithValues({ "0,0": 1, "0,1": 2, "1,1": 3 });
    let path = [{ r: 0, c: 0 }];
    path = stepPath(path, { r: 0, c: 1 }, grid);
    expect(path).toEqual([{ r: 0, c: 0 }, { r: 0, c: 1 }]);
    path = stepPath(path, { r: 1, c: 1 }, grid); // diagonal respecto a 0,0, adyacente a 0,1
    expect(path).toEqual([{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 1 }]);
  });

  it("volver a la celda anterior deshace el último paso (backtrack)", () => {
    const grid = gridWithValues({ "0,0": 1, "0,1": 2 });
    let path = [{ r: 0, c: 0 }];
    path = stepPath(path, { r: 0, c: 1 }, grid);
    expect(path.length).toBe(2);
    path = stepPath(path, { r: 0, c: 0 }, grid); // vuelve a la anterior
    expect(path).toEqual([{ r: 0, c: 0 }]);
  });

  it("no agrega una celda ya visitada (que no sea la inmediatamente anterior)", () => {
    const grid = gridWithValues({ "0,0": 1, "0,1": 2, "0,2": 3 });
    let path = [{ r: 0, c: 0 }];
    path = stepPath(path, { r: 0, c: 1 }, grid);
    path = stepPath(path, { r: 0, c: 2 }, grid);
    const beforeRevisit = path;
    path = stepPath(path, { r: 0, c: 0 }, grid); // no es la anterior (0,2 lo es) ni es adyacente a 0,2
    expect(path).toBe(beforeRevisit);
  });

  it("no agrega una celda vacía", () => {
    const grid = gridWithValues({ "0,0": 1 });
    const path = [{ r: 0, c: 0 }];
    const next = stepPath(path, { r: 0, c: 1 }, grid);
    expect(next).toBe(path);
  });

  it("no agrega una celda no adyacente", () => {
    const grid = gridWithValues({ "0,0": 1, "5,5": 2 });
    const path = [{ r: 0, c: 0 }];
    const next = stepPath(path, { r: 5, c: 5 }, grid);
    expect(next).toBe(path);
  });
});
