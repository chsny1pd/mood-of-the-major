import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import publicEn from "../locales/en/public.json";

export const LANGUAGE_STORAGE_KEY = "motm-language";

let englishBundlePromise: Promise<typeof import("../locales/en/translation.json")> | null = null;
let thaiBundlePromise: Promise<typeof import("../locales/th/translation.json")> | null = null;
let thaiPublicBundlePromise: Promise<typeof import("../locales/th/public.json")> | null = null;
let fullEnglishLoaded = false;
let fullThaiLoaded = false;
let thaiPublicLoaded = false;

async function ensureThaiPublicResources(): Promise<void> {
  if (thaiPublicLoaded) {
    return;
  }

  thaiPublicBundlePromise ??= import("../locales/th/public.json");
  const thaiPublic = await thaiPublicBundlePromise;
  i18n.addResourceBundle("th", "translation", thaiPublic, true, false);
  thaiPublicLoaded = true;
}

async function ensureEnglishResources(): Promise<void> {
  if (fullEnglishLoaded) {
    return;
  }

  englishBundlePromise ??= import("../locales/en/translation.json");
  const english = await englishBundlePromise;
  i18n.addResourceBundle("en", "translation", english, true, true);
  fullEnglishLoaded = true;
}

async function ensureThaiResources(): Promise<void> {
  if (fullThaiLoaded) {
    return;
  }

  await ensureThaiPublicResources();
  thaiBundlePromise ??= import("../locales/th/translation.json");
  const thai = await thaiBundlePromise;
  i18n.addResourceBundle("th", "translation", thai, true, true);
  fullThaiLoaded = true;
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: publicEn },
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

i18n.on("languageChanged", (language) => {
  applyDocumentLanguage(language.startsWith("th") ? "th" : "en");
});

void (async () => {
  const initialLanguage = i18n.resolvedLanguage ?? i18n.language;
  if (initialLanguage.startsWith("th")) {
    await ensureThaiPublicResources();
  }
  applyDocumentLanguage(initialLanguage.startsWith("th") ? "th" : "en");

  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const isMarketingHome = path === "/" || path === "";
  // Landing uses public.json only; avoid competing with LCP for the full catalog.
  if (isMarketingHome) {
    return;
  }

  const loadFullTranslations = async () => {
    if (initialLanguage.startsWith("th")) {
      await ensureThaiResources();
    } else {
      await ensureEnglishResources();
    }
  };

  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(
      () => {
        void loadFullTranslations();
      },
      { timeout: 2000 },
    );
  } else {
    setTimeout(() => {
      void loadFullTranslations();
    }, 200);
  }
})();

export function applyDocumentLanguage(code: string): void {
  if (typeof document !== "undefined") {
    document.documentElement.lang = code;
  }
}

export async function changeLanguage(code: string): Promise<void> {
  if (code.startsWith("th")) {
    await ensureThaiResources();
  } else {
    await ensureEnglishResources();
  }

  await i18n.changeLanguage(code);
}

export async function ensureFullTranslations(): Promise<void> {
  const language = i18n.resolvedLanguage ?? i18n.language;
  if (language.startsWith("th")) {
    await ensureThaiResources();
  } else {
    await ensureEnglishResources();
  }
}

export default i18n;
