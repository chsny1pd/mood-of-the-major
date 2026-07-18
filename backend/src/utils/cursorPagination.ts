export interface CursorPayload {
  createdAt: string;
  id: string;
  /** Included when paginating `most_reacted` feeds */
  reactionCount?: number;
  /** Included when paginating `most_commented` feeds */
  commentCount?: number;
}

export type FeedSortCursor = "newest" | "most_reacted" | "most_commented";

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
  items: Array<{
    id: string;
    createdAt: Date;
    reactionCount?: number;
    commentCount?: number;
  }>,
  limit: number,
  sort: FeedSortCursor = "newest",
): { nextCursor: string | null; hasMore: boolean } {
  if (items.length < limit) {
    return { nextCursor: null, hasMore: false };
  }

  const last = items[items.length - 1]!;
  const payload: CursorPayload = {
    createdAt: last.createdAt.toISOString(),
    id: last.id,
  };

  if (sort === "most_reacted") {
    payload.reactionCount = last.reactionCount ?? 0;
  } else if (sort === "most_commented") {
    payload.commentCount = last.commentCount ?? 0;
  }

  return {
    nextCursor: encodeCursor(payload),
    hasMore: true,
  };
}

/** Compound cursor for descending (count, createdAt, _id) sorts. */
export function buildDescendingCountCursorOr(params: {
  countField: "reactionCount" | "commentCount";
  cursorCount: number;
  cursorCreatedAt: Date;
  cursorId: string;
}): Array<Record<string, unknown>> {
  const { countField, cursorCount, cursorCreatedAt, cursorId } = params;

  return [
    { [countField]: { $lt: cursorCount } },
    { [countField]: cursorCount, createdAt: { $lt: cursorCreatedAt } },
    { [countField]: cursorCount, createdAt: cursorCreatedAt, _id: { $lt: cursorId } },
  ];
}
