export const APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const SUBMISSION_TYPES = ["faculty", "major", "tag"] as const;
export type SubmissionType = (typeof SUBMISSION_TYPES)[number];
