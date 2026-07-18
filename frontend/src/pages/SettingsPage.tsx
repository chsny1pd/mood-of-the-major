import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { LANGUAGE_STORAGE_KEY, changeLanguage as setAppLanguage } from "../lib/i18n";
import { ageFromBirthYear } from "../lib/age";
import { ROUTES } from "../constants/routes";
import { SettingsCard } from "../components/SettingsCard";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { ThemeToggle } from "../components/ThemeToggle";
import { themeClasses } from "../lib/themeClasses";
import { getApiErrorMessage } from "../services/apiClient";
import { updateMe } from "../services/authService";
import {
  confirmImageUpload,
  fetchSignedImageUrl,
  requestUploadUrl,
  uploadImageFile,
} from "../services/imageService";
import { fetchFaculties, fetchMajors, type FacultyOption, type MajorOption } from "../services/referenceService";
import { useLocalizedName } from "../lib/useLocalizedName";

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const localizedName = useLocalizedName();
  const { user, profileMeta, logout, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  const [realName, setRealName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [majorId, setMajorId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [majors, setMajors] = useState<MajorOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setRealName(user.realName ?? "");
    setDisplayName(user.displayName ?? profileMeta.displayName ?? "");
    setBirthYear(user.birthYear != null ? String(user.birthYear) : "");
    setFacultyId(user.facultyId ?? "");
    setMajorId(user.majorId ?? "");
    setAvatarUrl(user.avatarUrl ?? profileMeta.avatarUrl);
  }, [user, profileMeta]);

  useEffect(() => {
    void fetchFaculties()
      .then(setFaculties)
      .catch(() => setFaculties([]));
  }, []);

  useEffect(() => {
    if (!facultyId) {
      setMajors([]);
      return;
    }
    void fetchMajors(facultyId)
      .then(setMajors)
      .catch(() => setMajors([]));
  }, [facultyId]);

  if (!user) {
    return null;
  }

  const computedAge =
    birthYear && Number.isFinite(Number(birthYear))
      ? ageFromBirthYear(Number(birthYear))
      : null;

  const onAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      const presign = await requestUploadUrl({
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
      });
      await uploadImageFile(presign, file);
      await confirmImageUpload(presign.imageId);
      const url = await fetchSignedImageUrl(presign.imageId);
      setAvatarUrl(url);
      await updateMe({ avatarUrl: url });
      await refreshProfile();
      setMessage(t("settings.saveSuccess"));
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError, t("settings.uploadFailed")));
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const year = birthYear.trim() ? Number(birthYear) : null;
      await updateMe({
        realName: realName.trim() || null,
        displayName: displayName.trim() || null,
        birthYear: year,
        facultyId: facultyId || null,
        majorId: majorId || null,
        avatarUrl: avatarUrl,
      });
      await refreshProfile();
      setMessage(t("settings.saveSuccess"));
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, t("settings.saveFailed")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 font-display text-3xl font-semibold text-stone-900 dark:text-stone-100">
        {t("settings.title")}
      </h1>

      <div className="space-y-6">
        <SettingsCard title={t("settings.profile")}>
          <form onSubmit={onSubmit} className="space-y-5">
            {error ? <div className={themeClasses.errorBox}>{error}</div> : null}
            {message ? (
              <p className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-950 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-100">
                {message}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-4">
              <Avatar
                src={avatarUrl}
                name={displayName || user.email}
                email={user.email}
                size="lg"
                alt={displayName || t("settings.nameFallback")}
              />
              <div>
                <p className={`text-sm ${themeClasses.muted}`}>{t("settings.avatar")}</p>
                <label className="mt-2 inline-flex cursor-pointer">
                  <span className="rounded-xl bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700">
                    {uploading ? t("settings.uploading") : t("settings.changeAvatar")}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={uploading || saving}
                    onChange={(event) => void onAvatarChange(event)}
                  />
                </label>
              </div>
            </div>

            <p className={`text-sm ${themeClasses.muted}`}>{t("settings.privacyNote")}</p>

            <div>
              <label htmlFor="settings-real-name" className={themeClasses.label}>
                {t("settings.realName")}
              </label>
              <input
                id="settings-real-name"
                value={realName}
                onChange={(event) => setRealName(event.target.value)}
                className={`mt-1 ${themeClasses.input}`}
              />
            </div>

            <div>
              <label htmlFor="settings-display-name" className={themeClasses.label}>
                {t("settings.displayName")}
              </label>
              <input
                id="settings-display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className={`mt-1 ${themeClasses.input}`}
              />
            </div>

            <div>
              <label htmlFor="settings-birth-year" className={themeClasses.label}>
                {t("settings.birthYear")}
              </label>
              <input
                id="settings-birth-year"
                type="number"
                min={1950}
                max={new Date().getUTCFullYear()}
                value={birthYear}
                onChange={(event) => setBirthYear(event.target.value)}
                className={`mt-1 ${themeClasses.input}`}
              />
              {computedAge != null ? (
                <p className={`mt-1 text-sm ${themeClasses.muted}`}>
                  {t("settings.ageLabel", { age: computedAge })}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="settings-faculty" className={themeClasses.label}>
                {t("settings.faculty")}
              </label>
              <select
                id="settings-faculty"
                value={facultyId}
                onChange={(event) => {
                  setFacultyId(event.target.value);
                  setMajorId("");
                }}
                className={`mt-1 w-full ${themeClasses.select}`}
              >
                <option value="">{t("settings.selectFaculty")}</option>
                {faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {localizedName(faculty)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="settings-major" className={themeClasses.label}>
                {t("settings.major")}
              </label>
              <select
                id="settings-major"
                value={majorId}
                disabled={!facultyId}
                onChange={(event) => setMajorId(event.target.value)}
                className={`mt-1 w-full disabled:opacity-60 ${themeClasses.select}`}
              >
                <option value="">{t("settings.selectMajor")}</option>
                {majors.map((major) => (
                  <option key={major.id} value={major.id}>
                    {localizedName(major)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <dt className={`text-sm ${themeClasses.muted}`}>{t("settings.email")}</dt>
              <dd className={`mt-1 ${themeClasses.heading}`}>{user.email}</dd>
            </div>

            <Button type="submit" disabled={saving || uploading}>
              {saving ? t("settings.saving") : t("settings.saveProfile")}
            </Button>
          </form>
        </SettingsCard>

        <SettingsCard title={t("settings.preferences")}>
          <div className="space-y-6">
            <div>
              <p className={`mb-3 text-sm font-medium ${themeClasses.label}`}>{t("theme.label")}</p>
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
              <p className={`mb-3 text-sm font-medium ${themeClasses.label}`}>{t("language.label")}</p>
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
          <p className={`text-sm ${themeClasses.body}`}>{t("settings.logoutDescription")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => void logout()}>
              {t("settings.logoutButton")}
            </Button>
            <Link to={ROUTES.howToUse} className={themeClasses.link}>
              {t("nav.howToUse")}
            </Link>
          </div>
        </SettingsCard>
      </div>
    </section>
  );
}
