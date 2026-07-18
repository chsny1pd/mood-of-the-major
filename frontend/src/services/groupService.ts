import { apiClient } from "./apiClient";
import type { AnonymousMood, CreateMoodPayload, PaginatedMoods } from "../types/mood";
import type {
  CreateGroupPayload,
  GroupMemberAdmin,
  GroupSummary,
  PaginatedGroups,
} from "../types/group";

export async function fetchGroups(params: {
  q?: string;
  limit?: number;
  cursor?: string;
} = {}): Promise<PaginatedGroups> {
  const response = await apiClient.get<{
    success: true;
    data: GroupSummary[];
    meta: PaginatedGroups["meta"];
  }>("/groups", { params });

  return { data: response.data.data, meta: response.data.meta };
}

export async function fetchMyGroups(): Promise<GroupSummary[]> {
  const response = await apiClient.get<{ success: true; data: GroupSummary[] }>("/groups/mine");
  return response.data.data;
}

export async function fetchGroup(groupId: string): Promise<GroupSummary> {
  const response = await apiClient.get<{ success: true; data: GroupSummary }>(`/groups/${groupId}`);
  return response.data.data;
}

export async function createGroup(payload: CreateGroupPayload): Promise<GroupSummary> {
  const response = await apiClient.post<{ success: true; data: GroupSummary }>("/groups", payload);
  return response.data.data;
}

export async function joinGroup(groupId: string): Promise<GroupSummary> {
  const response = await apiClient.post<{ success: true; data: GroupSummary }>(
    `/groups/${groupId}/join`,
  );
  return response.data.data;
}

export async function leaveGroup(groupId: string): Promise<void> {
  await apiClient.delete(`/groups/${groupId}/leave`);
}

export async function fetchGroupMembers(groupId: string): Promise<GroupMemberAdmin[]> {
  const response = await apiClient.get<{ success: true; data: GroupMemberAdmin[] }>(
    `/groups/${groupId}/members`,
  );
  return response.data.data;
}

export async function kickGroupMember(groupId: string, userId: string): Promise<void> {
  await apiClient.delete(`/groups/${groupId}/members/${userId}`);
}

export async function fetchGroupMoods(
  groupId: string,
  params: { limit?: number; cursor?: string } = {},
): Promise<PaginatedMoods> {
  const response = await apiClient.get<{
    success: true;
    data: AnonymousMood[];
    meta: PaginatedMoods["meta"];
  }>(`/groups/${groupId}/moods`, { params });

  return { data: response.data.data, meta: response.data.meta };
}

export async function createGroupMood(
  groupId: string,
  payload: CreateMoodPayload,
): Promise<AnonymousMood> {
  const response = await apiClient.post<{ success: true; data: AnonymousMood }>(
    `/groups/${groupId}/moods`,
    payload,
  );
  return response.data.data;
}
