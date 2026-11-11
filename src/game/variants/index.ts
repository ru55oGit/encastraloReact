import { Variant, VariantEngine } from "../types";
import { numbersVariant } from "./numbers";
import { wordsVariant } from "./words/words";

const REGISTRY: Record<Variant, VariantEngine> = {
  numbers: numbersVariant,
  words: wordsVariant,
};

export function getVariantEngine(variant: Variant): VariantEngine {
  return REGISTRY[variant];
}
