export type GroupStatus = "active" | "archived";
export type GroupMemberRole = "owner" | "member";

export interface Group {
  id: string;
  name: string;
  description: string;
  coverImageUrl: string | null;
  ownerId: string;
  memberCount: number;
  status: GroupStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupMemberRole;
  joinedAt: Date;
}

export interface CreateGroupInput {
  name: string;
  description: string;
  coverImageUrl: string | null;
  ownerId: string;
}
