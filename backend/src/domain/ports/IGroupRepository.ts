import type { CreateGroupInput, Group, GroupMember, GroupMemberRole } from "../entities/Group.js";

export interface GroupListQuery {
  q?: string;
  limit: number;
  cursorCreatedAt?: Date;
  cursorId?: string;
}

export interface IGroupRepository {
  create(input: CreateGroupInput): Promise<Group>;
  findById(id: string): Promise<Group | null>;
  findByIds(ids: string[]): Promise<Group[]>;
  list(query: GroupListQuery): Promise<Group[]>;
  countOwnedByUser(userId: string): Promise<number>;
  incrementMemberCount(groupId: string, delta: number): Promise<void>;
  softDelete(groupId: string): Promise<boolean>;
}

export interface IGroupMemberRepository {
  create(input: {
    groupId: string;
    userId: string;
    role: GroupMemberRole;
  }): Promise<GroupMember>;
  findMembership(groupId: string, userId: string): Promise<GroupMember | null>;
  deleteMembership(groupId: string, userId: string): Promise<boolean>;
  listByGroup(groupId: string): Promise<GroupMember[]>;
  listByUser(userId: string): Promise<GroupMember[]>;
  countByGroup(groupId: string): Promise<number>;
}
