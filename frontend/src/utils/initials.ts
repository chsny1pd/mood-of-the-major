export function getInitials(name: string | null | undefined, email?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
    }

    return parts[0]!.slice(0, 2).toUpperCase();
  }

  if (email?.trim()) {
    const local = email.split("@")[0] ?? email;
    return local.slice(0, 2).toUpperCase();
  }

  return "?";
}
