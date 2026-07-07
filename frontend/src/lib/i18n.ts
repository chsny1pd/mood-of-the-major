import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "../locales/en/translation.json";
import th from "../locales/th/translation.json";

export const LANGUAGE_STORAGE_KEY = "motm-language";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      th: { translation: th },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "th"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },
  });

export function applyDocumentLanguage(code: string): void {
  if (typeof document !== "undefined") {
    document.documentElement.lang = code;
  }
}

i18n.on("languageChanged", (language) => {
  applyDocumentLanguage(language.startsWith("th") ? "th" : "en");
});

applyDocumentLanguage(i18n.resolvedLanguage?.startsWith("th") ? "th" : "en");

export default i18n;
