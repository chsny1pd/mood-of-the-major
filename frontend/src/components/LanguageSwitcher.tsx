import { useTranslation } from "react-i18next";
import { LANGUAGE_STORAGE_KEY, changeLanguage as setAppLanguage } from "../lib/i18n";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/DropdownMenu";

const languages = [
  { code: "en", labelKey: "language.en" },
  { code: "th", labelKey: "language.th" },
] as const;

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = i18n.resolvedLanguage?.startsWith("th") ? "th" : "en";

  const changeLanguage = (code: string) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    void setAppLanguage(code);
  };

  return (
    <DropdownMenu
      label={t("language.label")}
      trigger={
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-xs font-semibold uppercase text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800">
          {current}
        </span>
      }
    >
      <DropdownMenuLabel>{t("language.label")}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {languages.map(({ code, labelKey }) => (
        <DropdownMenuItem
          key={code}
          onSelect={() => changeLanguage(code)}
          className={current === code ? "bg-orange-50 text-orange-900 dark:bg-orange-950 dark:text-orange-100" : ""}
        >
          {t(labelKey)}
        </DropdownMenuItem>
      ))}
    </DropdownMenu>
  );
}
