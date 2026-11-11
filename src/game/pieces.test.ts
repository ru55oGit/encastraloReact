import { describe, expect, it } from "vitest";
import { createPiece, normalizeCells, pieceDims, rotatePiece } from "./pieces";

const fixedValue = () => 1;

describe("rotatePiece", () => {
  it("rota 90° y vuelve a normalizar (min r/c en 0)", () => {
    const piece = createPiece("L", fixedValue);
    const rotated = rotatePiece(piece);
    const minR = Math.min(...rotated.cells.map((c) => c.r));
    const minC = Math.min(...rotated.cells.map((c) => c.c));
    expect(minR).toBe(0);
    expect(minC).toBe(0);
  });

  it("4 rotaciones vuelven a la forma original", () => {
    const piece = createPiece("T", fixedValue);
    const original = [...piece.cells].sort((a, b) => a.r - b.r || a.c - b.c);
    let rotated = piece;
    for (let i = 0; i < 4; i++) rotated = rotatePiece(rotated);
    const final = [...rotated.cells].sort((a, b) => a.r - b.r || a.c - b.c);
    expect(final.map((c) => `${c.r},${c.c}`)).toEqual(original.map((c) => `${c.r},${c.c}`));
  });

  it("preserva el color y la cantidad de celdas", () => {
    const piece = createPiece("Z", fixedValue);
    const rotated = rotatePiece(piece);
    expect(rotated.color).toBe(piece.color);
    expect(rotated.cells.length).toBe(piece.cells.length);
  });

  it("rota la pieza punto (1 celda) sin cambios", () => {
    const piece = createPiece("punto", fixedValue);
    const rotated = rotatePiece(piece);
    expect(rotated.cells).toEqual([{ r: 0, c: 0, value: 1 }]);
  });
});

describe("normalizeCells", () => {
  it("corre todas las celdas para que la mínima quede en 0,0", () => {
    const normalized = normalizeCells([
      { r: 2, c: 3, value: 1 },
      { r: 3, c: 3, value: 2 },
    ]);
    expect(normalized).toEqual([
      { r: 0, c: 0, value: 1 },
      { r: 1, c: 0, value: 2 },
    ]);
  });
});

describe("pieceDims", () => {
  it("calcula el ancho/alto en base a las celdas", () => {
    const piece = createPiece("L", fixedValue);
    const dims = pieceDims(piece);
    // L (antes de rotar) es 3 filas x 2 columnas; tras una rotación
    // aleatoria de partida puede quedar 2x3 — cualquiera de las dos es
    // válida, lo que importa es que sea consistente con sus propias celdas.
    const expectedWidth = Math.max(...piece.cells.map((c) => c.c)) + 1;
    const expectedHeight = Math.max(...piece.cells.map((c) => c.r)) + 1;
    expect(dims.width).toBe(expectedWidth);
    expect(dims.height).toBe(expectedHeight);
  });
});
