export function slugifyName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const normalized = slugifyName(base) || "item";
  let candidate = normalized;
  let attempt = 0;

  while (await exists(candidate)) {
    attempt += 1;
    candidate = `${normalized}-${attempt}`;
  }

  return candidate;
}
