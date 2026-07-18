import { useTranslation } from "react-i18next";
import { useTheme } from "../hooks/useTheme";
import type { ThemeMode } from "../contexts/theme-context";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/DropdownMenu";

const themeOptions: ThemeMode[] = ["light", "dark", "system"];

function ThemeIcon({ mode }: { mode: ThemeMode }) {
  if (mode === "light") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    );
  }

  if (mode === "dark") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu
      label={t("theme.label")}
      trigger={
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800">
          <ThemeIcon mode={theme} />
        </span>
      }
    >
      <DropdownMenuLabel>{t("theme.label")}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {themeOptions.map((option) => (
        <DropdownMenuItem
          key={option}
          onSelect={() => setTheme(option)}
          className={theme === option ? "bg-orange-50 text-orange-900 dark:bg-orange-950 dark:text-orange-100" : ""}
        >
          <ThemeIcon mode={option} />
          {t(`theme.${option}`)}
        </DropdownMenuItem>
      ))}
    </DropdownMenu>
  );
}
