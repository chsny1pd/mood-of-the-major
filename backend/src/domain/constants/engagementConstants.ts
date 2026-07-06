export const COMMENT_CONTENT_MIN_LENGTH = 1;
export const COMMENT_CONTENT_MAX_LENGTH = 2000;
export const COMMENT_MAX_THREAD_DEPTH = 3;

export const REACTION_TYPES = ["empathy", "support", "relate", "solidarity"] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

export const REPORT_REASON_CODES = [
  "harassment",
  "spam",
  "self_harm",
  "hate_speech",
  "other",
] as const;
export type ReportReasonCode = (typeof REPORT_REASON_CODES)[number];

export const REPORT_DESCRIPTION_MAX_LENGTH = 1000;
export const REPORT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export const ENGAGEMENT_DEFAULT_LIMIT = 20;
export const ENGAGEMENT_MAX_LIMIT = 50;

export const SEARCH_QUERY_MIN_LENGTH = 2;
