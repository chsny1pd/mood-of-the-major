export interface LocalizedReference {
  name: string;
  nameTh?: string | null;
}

export function isThaiLanguage(language: string | undefined): boolean {
  return language?.startsWith("th") ?? false;
}

export function getLocalizedName(
  item: LocalizedReference,
  language: string | undefined,
): string {
  if (isThaiLanguage(language) && item.nameTh) {
    return item.nameTh;
  }

  return item.name;
}
