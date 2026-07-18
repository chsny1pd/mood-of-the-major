import {
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUP_LIST_DEFAULT_LIMIT,
  GROUP_LIST_MAX_LIMIT,
  GROUP_NAME_MAX_LENGTH,
  GROUP_NAME_MIN_LENGTH,
  MAX_OWNED_GROUPS_PER_USER,
} from "../../domain/constants/groupConstants.js";
import type { Group, GroupMember } from "../../domain/entities/Group.js";
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../domain/errors/AppError.js";
import type {
  IGroupMemberRepository,
  IGroupRepository,
} from "../../domain/ports/IGroupRepository.js";
import type { MoodWithRelations } from "../../domain/ports/IMoodRepository.js";
import type { IUserRepository } from "../../domain/ports/IUserRepository.js";
import type { MoodService, CreateMoodServiceInput } from "./MoodService.js";
import { buildNextCursor, decodeCursor } from "../../utils/cursorPagination.js";

export interface GroupPublicDto {
  id: string;
  name: string;
  description: string;
  coverImageUrl: string | null;
  memberCount: number;
  isMember: boolean;
  isOwner: boolean;
  createdAt: string;
}

export interface GroupMemberAdminDto {
  membershipId: string;
  userId: string;
  displayLabel: string;
  role: "owner" | "member";
  joinedAt: string;
}

export class GroupService {
  constructor(
    private readonly groups: IGroupRepository,
    private readonly members: IGroupMemberRepository,
    private readonly users: IUserRepository,
    private readonly moodService: MoodService,
  ) {}

  private toPublicDto(group: Group, membership: GroupMember | null): GroupPublicDto {
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      coverImageUrl: group.coverImageUrl,
      memberCount: group.memberCount,
      isMember: membership !== null,
      isOwner: membership?.role === "owner",
      createdAt: group.createdAt.toISOString(),
    };
  }

  async listGroups(
    userId: string,
    input: { q?: string; limit?: number; cursor?: string },
  ): Promise<{ items: GroupPublicDto[]; meta: { limit: number; nextCursor: string | null; hasMore: boolean } }> {
    const limit = Math.min(input.limit ?? GROUP_LIST_DEFAULT_LIMIT, GROUP_LIST_MAX_LIMIT);
    const decoded = input.cursor ? decodeCursor(input.cursor) : null;

    const groups = await this.groups.list({
      q: input.q,
      limit,
      cursorCreatedAt: decoded ? new Date(decoded.createdAt) : undefined,
      cursorId: decoded?.id,
    });

    const items: GroupPublicDto[] = [];
    for (const group of groups) {
      const membership = await this.members.findMembership(group.id, userId);
      items.push(this.toPublicDto(group, membership));
    }

    const pagination = buildNextCursor(
      groups.map((g) => ({ id: g.id, createdAt: g.createdAt })),
      limit,
    );

    return {
      items,
      meta: {
        limit,
        nextCursor: pagination.nextCursor,
        hasMore: pagination.hasMore,
      },
    };
  }

  async createGroup(
    userId: string,
    input: { name: string; description?: string; coverImageUrl?: string | null },
  ): Promise<GroupPublicDto> {
    const name = input.name.trim();
    const description = (input.description ?? "").trim();
    const coverImageUrl = input.coverImageUrl?.trim() || null;

    if (name.length < GROUP_NAME_MIN_LENGTH || name.length > GROUP_NAME_MAX_LENGTH) {
      throw new ValidationError("Invalid group name", [
        {
          field: "name",
          message: `Name must be between ${GROUP_NAME_MIN_LENGTH} and ${GROUP_NAME_MAX_LENGTH} characters.`,
        },
      ]);
    }

    if (description.length > GROUP_DESCRIPTION_MAX_LENGTH) {
      throw new ValidationError("Invalid description", [
        {
          field: "description",
          message: `Description must be at most ${GROUP_DESCRIPTION_MAX_LENGTH} characters.`,
        },
      ]);
    }

    if (coverImageUrl && !/^https?:\/\//i.test(coverImageUrl)) {
      throw new ValidationError("Invalid cover image URL", [
        { field: "coverImageUrl", message: "Cover image must be an http(s) URL." },
      ]);
    }

    const ownedCount = await this.groups.countOwnedByUser(userId);
    if (ownedCount >= MAX_OWNED_GROUPS_PER_USER) {
      throw new ConflictError(
        `You can create at most ${MAX_OWNED_GROUPS_PER_USER} groups.`,
        "GROUP_CREATE_LIMIT",
      );
    }

    const group = await this.groups.create({
      name,
      description,
      coverImageUrl,
      ownerId: userId,
    });

    const membership = await this.members.create({
      groupId: group.id,
      userId,
      role: "owner",
    });

    return this.toPublicDto(group, membership);
  }

  async getGroup(userId: string, groupId: string): Promise<GroupPublicDto> {
    const group = await this.groups.findById(groupId);
    if (!group) {
      throw new NotFoundError("Group not found", "GROUP_NOT_FOUND");
    }

    const membership = await this.members.findMembership(groupId, userId);
    return this.toPublicDto(group, membership);
  }

  async joinGroup(userId: string, groupId: string): Promise<GroupPublicDto> {
    const group = await this.groups.findById(groupId);
    if (!group) {
      throw new NotFoundError("Group not found", "GROUP_NOT_FOUND");
    }

    const existing = await this.members.findMembership(groupId, userId);
    if (existing) {
      return this.toPublicDto(group, existing);
    }

    const membership = await this.members.create({
      groupId,
      userId,
      role: "member",
    });
    await this.groups.incrementMemberCount(groupId, 1);

    const updated = await this.groups.findById(groupId);
    return this.toPublicDto(updated ?? { ...group, memberCount: group.memberCount + 1 }, membership);
  }

  async leaveGroup(userId: string, groupId: string): Promise<void> {
    const group = await this.groups.findById(groupId);
    if (!group) {
      throw new NotFoundError("Group not found", "GROUP_NOT_FOUND");
    }

    const membership = await this.members.findMembership(groupId, userId);
    if (!membership) {
      throw new NotFoundError("Not a member of this group", "GROUP_NOT_MEMBER");
    }

    if (membership.role === "owner") {
      throw new AuthorizationError("Group owners cannot leave. Transfer or archive the group first.", "GROUP_OWNER_CANNOT_LEAVE");
    }

    await this.members.deleteMembership(groupId, userId);
    await this.groups.incrementMemberCount(groupId, -1);
  }

  async listMembers(userId: string, groupId: string): Promise<GroupMemberAdminDto[]> {
    const group = await this.groups.findById(groupId);
    if (!group) {
      throw new NotFoundError("Group not found", "GROUP_NOT_FOUND");
    }

    const membership = await this.members.findMembership(groupId, userId);
    if (!membership || membership.role !== "owner") {
      throw new AuthorizationError("Only the group owner can view members", "GROUP_OWNER_REQUIRED");
    }

    const members = await this.members.listByGroup(groupId);
    const result: GroupMemberAdminDto[] = [];

    for (const member of members) {
      const user = await this.users.findById(member.userId);
      result.push({
        membershipId: member.id,
        userId: member.userId,
        displayLabel: user?.displayName?.trim() || "Member",
        role: member.role,
        joinedAt: member.joinedAt.toISOString(),
      });
    }

    return result;
  }

  async kickMember(ownerId: string, groupId: string, targetUserId: string): Promise<void> {
    const group = await this.groups.findById(groupId);
    if (!group) {
      throw new NotFoundError("Group not found", "GROUP_NOT_FOUND");
    }

    const ownerMembership = await this.members.findMembership(groupId, ownerId);
    if (!ownerMembership || ownerMembership.role !== "owner") {
      throw new AuthorizationError("Only the group owner can remove members", "GROUP_OWNER_REQUIRED");
    }

    if (targetUserId === ownerId) {
      throw new ValidationError("Cannot remove yourself", [
        { field: "userId", message: "Owners cannot remove themselves from the group." },
      ]);
    }

    const target = await this.members.findMembership(groupId, targetUserId);
    if (!target) {
      throw new NotFoundError("Member not found", "GROUP_MEMBER_NOT_FOUND");
    }

    if (target.role === "owner") {
      throw new AuthorizationError("Cannot remove the group owner", "GROUP_CANNOT_KICK_OWNER");
    }

    await this.members.deleteMembership(groupId, targetUserId);
    await this.groups.incrementMemberCount(groupId, -1);
  }

  async requireMembership(userId: string, groupId: string): Promise<GroupMember> {
    const group = await this.groups.findById(groupId);
    if (!group) {
      throw new NotFoundError("Group not found", "GROUP_NOT_FOUND");
    }

    const membership = await this.members.findMembership(groupId, userId);
    if (!membership) {
      throw new AuthorizationError("Join this group to view posts", "GROUP_MEMBERSHIP_REQUIRED");
    }

    return membership;
  }

  async getGroupFeed(
    userId: string,
    groupId: string,
    input: { limit?: number; cursor?: string },
  ): Promise<{ items: MoodWithRelations[]; meta: { limit: number; nextCursor: string | null; hasMore: boolean } }> {
    await this.requireMembership(userId, groupId);
    return this.moodService.getGroupFeed(groupId, input);
  }

  async createGroupMood(
    userId: string,
    groupId: string,
    input: Omit<CreateMoodServiceInput, "groupId">,
  ): Promise<MoodWithRelations> {
    await this.requireMembership(userId, groupId);
    return this.moodService.createMood(userId, { ...input, groupId });
  }
}
