export const DEFAULT_RATE_LIMITS = {
  auth: { windowMs: 15 * 60 * 1000, max: 10 },
  write: { windowMs: 60 * 60 * 1000, max: 30 },
  feed: { windowMs: 60 * 1000, max: 120 },
  general: { windowMs: 60 * 1000, max: 300 },
} as const;

export const DEFAULT_ORPHAN_IMAGE_TTL_HOURS = 24;

export const DEFAULT_IMAGE_CLEANUP_BATCH_SIZE = 100;
