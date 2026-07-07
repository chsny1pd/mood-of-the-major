import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getLocalizedName, type LocalizedReference } from "./localizedName";

export function useLocalizedName() {
  const { i18n } = useTranslation();

  return useCallback(
    (item: LocalizedReference | null | undefined) => {
      if (!item) {
        return "";
      }

      return getLocalizedName(item, i18n.resolvedLanguage);
    },
    [i18n.resolvedLanguage],
  );
}
