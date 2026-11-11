import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  Translation,
  translations,
  SupportedLanguage,
  availableLanguages,
} from "./translations";

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: Translation;
  availableLanguages: Array<{
    code: SupportedLanguage;
    name: string;
    flag: string;
  }>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

const LANGUAGE_STORAGE_KEY = "encastralo_language";

// El hub pasa el idioma elegido por query param al linkear a cada juego
// (?lang=xx) — tiene prioridad sobre lo guardado localmente. Resuelta de
// forma SÍNCRONA (no en un useEffect posterior): cualquier lectura que
// dependa del idioma en el primer render (ej. qué partida guardada
// retomar, ver utils/inProgressGameState.ts) necesita el valor correcto
// desde el arranque, no uno que se corrige un tick después.
function resolveInitialLanguage(): SupportedLanguage {
  try {
    const urlLang = new URLSearchParams(window.location.search).get("lang") as SupportedLanguage | null;
    if (urlLang && translations[urlLang]) return urlLang;

    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage | null;
    if (savedLanguage && translations[savedLanguage]) return savedLanguage;
  } catch {
    // localStorage no disponible (modo privado estricto, etc.)
  }
  return "es";
}

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const [currentLanguage, setCurrentLanguage] =
    useState<SupportedLanguage>(resolveInitialLanguage);

  useEffect(() => {
    // La resolución en sí ya ocurrió de forma síncrona arriba — acá solo
    // falta persistir el ?lang= de la URL para que la próxima visita (sin
    // query param) arranque en ese mismo idioma.
    const urlLang = new URLSearchParams(window.location.search).get(
      "lang",
    ) as SupportedLanguage | null;
    if (urlLang && translations[urlLang]) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, urlLang);
    }
  }, []);

  const setLanguage = (language: SupportedLanguage) => {
    setCurrentLanguage(language);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  };

  const contextValue: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t: translations[currentLanguage],
    availableLanguages,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
