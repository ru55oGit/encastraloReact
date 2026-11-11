import { SupportedLanguage } from "../../i18n/translations";
import { Variant, VariantEngine } from "../types";
import { fruitsVariant } from "./fruits";
import { numbersVariant } from "./numbers";

// Números y frutas tienen un único engine fijo y liviano, importado acá
// arriba sin problema. Palabras es otra historia: su diccionario (ver
// src/data/dictionaries.ts) carga los paquetes an-array-of-spanish-words /
// an-array-of-english-words enteros (~900k palabras combinadas) — si
// ./words/words se importara acá como las otras dos, ESE peso entraría al
// bundle principal de la app y lo pagaría cualquiera que abra Encastralo,
// aunque solo vaya a jugar números o frutas. Por eso esta función es
// async y usa import() dinámico: Vite separa ./words/words en un chunk
// aparte, que solo se descarga cuando alguien elige jugar palabras.
const STATIC_REGISTRY: Record<"numbers" | "fruits", VariantEngine> = {
  numbers: numbersVariant,
  fruits: fruitsVariant,
};

export async function resolveVariantEngine(variant: Variant, lang: SupportedLanguage): Promise<VariantEngine> {
  if (variant === "words") {
    const { getWordsVariant } = await import("./words/words");
    return getWordsVariant(lang);
  }
  return STATIC_REGISTRY[variant];
}
