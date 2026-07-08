import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { LANGUAGE_STORAGE_KEY, changeLanguage as setAppLanguage } from "../lib/i18n";
import { ROUTES } from "../constants/routes";
import { SettingsCard } from "../components/SettingsCard";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { ThemeToggle } from "../components/ThemeToggle";

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, profileMeta, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  if (!user) {
    return null;
  }

  const displayName = profileMeta.displayName ?? t("settings.nameFallback");

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-3xl font-semibold text-stone-900 dark:text-stone-100">
        {t("settings.title")}
      </h1>

      <div className="space-y-6">
        <SettingsCard title={t("settings.profile")}>
          <div className="flex items-center gap-4">
            <Avatar
              src={profileMeta.avatarUrl}
              name={profileMeta.displayName}
              email={user.email}
              size="lg"
              alt={displayName}
            />
            <div className="min-w-0">
              <p className="text-sm text-stone-500 dark:text-stone-400">{t("settings.avatar")}</p>
              <p className="truncate font-medium text-stone-900 dark:text-stone-100">{displayName}</p>
            </div>
          </div>

          <dl className="mt-6 space-y-4">
            <div>
              <dt className="text-sm text-stone-500 dark:text-stone-400">{t("settings.name")}</dt>
              <dd className="mt-1 text-stone-900 dark:text-stone-100">{displayName}</dd>
            </div>
            <div>
              <dt className="text-sm text-stone-500 dark:text-stone-400">{t("settings.email")}</dt>
              <dd className="mt-1 text-stone-900 dark:text-stone-100">{user.email}</dd>
            </div>
          </dl>
        </SettingsCard>

        <SettingsCard title={t("settings.preferences")}>
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-medium text-stone-700 dark:text-stone-300">
                {t("theme.label")}
              </p>
              <div className="flex flex-wrap gap-2">
                {(["light", "dark", "system"] as const).map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={theme === option ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setTheme(option)}
                  >
                    {t(`theme.${option}`)}
                  </Button>
                ))}
              </div>
              <div className="mt-3 lg:hidden">
                <ThemeToggle />
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-stone-700 dark:text-stone-300">
                {t("language.label")}
              </p>
              <div className="flex flex-wrap gap-2">
                {(["en", "th"] as const).map((code) => {
                  const current = i18n.resolvedLanguage?.startsWith("th") ? "th" : "en";
                  return (
                    <Button
                      key={code}
                      type="button"
                      variant={current === code ? "primary" : "outline"}
                      size="sm"
                      onClick={() => {
                        localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
                        void setAppLanguage(code);
                      }}
                    >
                      {t(`language.${code}`)}
                    </Button>
                  );
                })}
              </div>
              <div className="mt-3 lg:hidden">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard title={t("settings.account")}>
          <p className="mb-4 text-sm text-stone-600 dark:text-stone-400">
            {t("settings.logoutDescription")}
          </p>
          <Button type="button" variant="outline" onClick={() => void logout()}>
            {t("settings.logoutButton")}
          </Button>
          <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
            <Link to={ROUTES.howToUse} className="text-teal-800 hover:underline dark:text-teal-300">
              {t("nav.howToUse")}
            </Link>
          </p>
        </SettingsCard>
      </div>
    </section>
  );
}
