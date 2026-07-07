export const REACTION_TYPES = [
  { type: "empathy", emoji: "💙" },
  { type: "support", emoji: "🤝" },
  { type: "relate", emoji: "🫂" },
  { type: "solidarity", emoji: "✊" },
] as const;

export type ReactionType = (typeof REACTION_TYPES)[number]["type"];

export const REPORT_REASONS = [
  { code: "harassment" },
  { code: "spam" },
  { code: "self_harm" },
  { code: "hate_speech" },
  { code: "other" },
] as const;

export type ReportReasonCode = (typeof REPORT_REASONS)[number]["code"];

export function getReactionTranslationKey(type: ReactionType): string {
  return `engagement.reactions.${type}`;
}

export function getReportReasonTranslationKey(code: ReportReasonCode): string {
  return `engagement.reportReasons.${code}`;
}

export interface AnonymousComment {
  id: string;
  content: string;
  parentId: string | null;
  depth: number;
  reactionSummary: Record<string, number>;
  createdAt: string;
  isOwner?: boolean;
}

export interface PaginatedComments {
  data: AnonymousComment[];
  meta: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface ReactionView {
  targetType: "mood" | "comment";
  targetId: string;
  reactionSummary: Record<string, number>;
  userReaction: ReactionType | null;
}
