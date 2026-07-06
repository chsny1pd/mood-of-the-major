export interface CursorPayload {
  createdAt: string;
  id: string;
}

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as CursorPayload;

    if (!parsed.createdAt || !parsed.id) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function buildNextCursor(
  items: Array<{ id: string; createdAt: Date }>,
  limit: number,
): { nextCursor: string | null; hasMore: boolean } {
  if (items.length < limit) {
    return { nextCursor: null, hasMore: false };
  }

  const last = items[items.length - 1];

  return {
    nextCursor: encodeCursor({
      createdAt: last.createdAt.toISOString(),
      id: last.id,
    }),
    hasMore: true,
  };
}
