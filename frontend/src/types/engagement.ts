export const REACTION_TYPES = [
  { type: "empathy", label: "Empathy", emoji: "💙" },
  { type: "support", label: "Support", emoji: "🤝" },
  { type: "relate", label: "Relate", emoji: "🫂" },
  { type: "solidarity", label: "Solidarity", emoji: "✊" },
] as const;

export type ReactionType = (typeof REACTION_TYPES)[number]["type"];

export const REPORT_REASONS = [
  { code: "harassment", label: "Harassment" },
  { code: "spam", label: "Spam" },
  { code: "self_harm", label: "Self harm" },
  { code: "hate_speech", label: "Hate speech" },
  { code: "other", label: "Other" },
] as const;

export type ReportReasonCode = (typeof REPORT_REASONS)[number]["code"];

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
