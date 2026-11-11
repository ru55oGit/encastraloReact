import { describe, expect, it } from "vitest";
import { canPlace, clearCells, createEmptyColorGrid, createEmptyGrid, fitsAnywhere, isAdjacent8, place } from "./board";
import { Grid, Piece } from "./types";

function piece(cells: { r: number; c: number }[]): Piece {
  return { id: "test", shape: "punto", color: "#fff", cells: cells.map((c) => ({ ...c, value: 1 })) };
}

describe("canPlace", () => {
  it("entra en una grilla vacía", () => {
    const grid = createEmptyGrid();
    expect(canPlace(grid, piece([{ r: 0, c: 0 }]), { r: 3, c: 3 })).toBe(true);
  });

  it("no entra si alguna celda está ocupada", () => {
    const grid = createEmptyGrid();
    grid[3][4] = 5;
    expect(canPlace(grid, piece([{ r: 0, c: 0 }, { r: 0, c: 1 }]), { r: 3, c: 3 })).toBe(false);
  });

  it("no entra si se sale del tablero", () => {
    const grid = createEmptyGrid();
    expect(canPlace(grid, piece([{ r: 0, c: 0 }, { r: 0, c: 1 }]), { r: 0, c: 7 })).toBe(false);
  });
});

describe("place", () => {
  it("no muta las grillas originales (inmutable)", () => {
    const grid = createEmptyGrid();
    const colorGrid = createEmptyColorGrid();
    const result = place(grid, colorGrid, piece([{ r: 0, c: 0 }]), { r: 2, c: 2 });
    expect(grid[2][2]).toBeNull();
    expect(result.grid[2][2]).toBe(1);
    expect(result.colorGrid[2][2]).toBe("#fff");
  });
});

describe("fitsAnywhere", () => {
  it("es true en una grilla vacía", () => {
    const grid = createEmptyGrid();
    expect(fitsAnywhere(grid, piece([{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }]))) .toBe(true);
  });

  it("es false cuando el tablero está completamente lleno", () => {
    const grid = createEmptyGrid().map((row) => row.map(() => 1));
    expect(fitsAnywhere(grid, piece([{ r: 0, c: 0 }]))).toBe(false);
  });

  it("prueba las 4 rotaciones: una forma que no entra derecha puede entrar rotada", () => {
    // Deja libre una sola fila de 8 casillas — una I3 vertical no entra en
    // ningún lado, pero rotada (horizontal) sí.
    const grid: Grid = createEmptyGrid().map((row) => row.map(() => 1));
    for (let c = 0; c < 8; c++) grid[0][c] = null;
    const verticalI3 = piece([{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }]);
    expect(fitsAnywhere(grid, verticalI3)).toBe(true);
  });
});

describe("isAdjacent8", () => {
  it("es true para las 8 direcciones (incluidas diagonales)", () => {
    const center = { r: 3, c: 3 };
    const neighbors = [
      { r: 2, c: 3 }, { r: 4, c: 3 }, { r: 3, c: 2 }, { r: 3, c: 4 },
      { r: 2, c: 2 }, { r: 2, c: 4 }, { r: 4, c: 2 }, { r: 4, c: 4 },
    ];
    for (const n of neighbors) expect(isAdjacent8(center, n)).toBe(true);
  });

  it("es false para la misma celda", () => {
    expect(isAdjacent8({ r: 1, c: 1 }, { r: 1, c: 1 })).toBe(false);
  });

  it("es false para una celda a distancia 2", () => {
    expect(isAdjacent8({ r: 1, c: 1 }, { r: 3, c: 1 })).toBe(false);
    expect(isAdjacent8({ r: 1, c: 1 }, { r: 3, c: 3 })).toBe(false);
  });
});

describe("clearCells", () => {
  it("vacía solo las celdas del camino, sin mutar la grilla original", () => {
    const grid = createEmptyGrid();
    grid[0][0] = 5;
    grid[0][1] = 5;
    const colorGrid = createEmptyColorGrid();
    const result = clearCells(grid, colorGrid, [{ r: 0, c: 0 }, { r: 0, c: 1 }]);
    expect(grid[0][0]).toBe(5);
    expect(result.grid[0][0]).toBeNull();
    expect(result.grid[0][1]).toBeNull();
  });
});
