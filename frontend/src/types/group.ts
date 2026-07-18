export interface GroupSummary {
  id: string;
  name: string;
  description: string;
  coverImageUrl: string | null;
  memberCount: number;
  isMember: boolean;
  isOwner: boolean;
  createdAt: string;
}

export interface GroupMemberAdmin {
  membershipId: string;
  userId: string;
  displayLabel: string;
  role: "owner" | "member";
  joinedAt: string;
}

export interface PaginatedGroups {
  data: GroupSummary[];
  meta: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  coverImageUrl?: string | null;
}
