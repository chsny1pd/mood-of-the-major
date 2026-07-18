export const DEFAULT_REACTION_EMOJIS = [
  { emoji: "💙", translationKey: "engagement.reactions.empathy" },
  { emoji: "🤝", translationKey: "engagement.reactions.support" },
  { emoji: "🫂", translationKey: "engagement.reactions.relate" },
  { emoji: "✊", translationKey: "engagement.reactions.solidarity" },
] as const;

export const REPORT_REASONS = [
  { code: "harassment" },
  { code: "spam" },
  { code: "self_harm" },
  { code: "hate_speech" },
  { code: "other" },
] as const;

export type ReportReasonCode = (typeof REPORT_REASONS)[number]["code"];

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
  userReactions: string[];
}
