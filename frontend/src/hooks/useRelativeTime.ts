import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function useRelativeTime(isoDate: string): string {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const date = new Date(isoDate);
  const diffMs = now - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return t("time.justNow");
  if (diffMinutes < 60) return t("time.minutesAgo", { count: diffMinutes });

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return t("time.hoursAgo", { count: diffHours });

  const diffDays = Math.floor(diffHours / 24);
  return t("time.daysAgo", { count: diffDays });
}
