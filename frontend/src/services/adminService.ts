import { apiClient } from "./apiClient";

export interface AdminDashboard {
  openReports: number;
  actionsToday: number;
  activeUsers24h: number;
  moodsCreated24h: number;
  totalUsers: number;
  totalPosts: number;
  totalFaculties: number;
  totalMajors: number;
  totalMoods: number;
  pendingSubmissions: number;
  recentActions: Array<{
    id: string;
    adminId: string;
    adminEmail: string | null;
    action: string;
    targetType: string;
    targetId: string | null;
    identityAccessed: boolean;
    createdAt: string;
  }>;
}

export interface AdminReportItem {
  id: string;
  targetType: "mood" | "comment";
  targetId: string;
  reasonCode: string;
  description: string | null;
  status: string;
  contentPreview: string | null;
  createdAt: string;
}

export interface AdminUserItem {
  id: string;
  email: string;
  role: string;
  status: string;
  faculty: { id: string; name: string; slug: string } | null;
  major: { id: string; name: string; slug: string } | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export type AdminUserRole = "student" | "administrator" | "advisor";

export interface AuditLogItem {
  id: string;
  adminId: string;
  adminEmail: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  identityAccessed: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface PaginatedMeta {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export async function fetchAdminDashboard(): Promise<AdminDashboard> {
  const response = await apiClient.get<{ success: true; data: AdminDashboard }>("/admin/dashboard");
  return response.data.data;
}

export async function fetchAdminReports(params?: {
  status?: string;
  targetType?: string;
  cursor?: string;
  limit?: number;
}) {
  const response = await apiClient.get<{
    success: true;
    data: AdminReportItem[];
    meta: PaginatedMeta & { pendingCount?: number };
  }>("/admin/reports", { params });
  return response.data;
}

export async function resolveReport(
  reportId: string,
  body: {
    status: "resolved_removed" | "resolved_dismissed" | "resolved_warned";
    resolutionNote?: string;
    removeContent?: boolean;
  },
) {
  const response = await apiClient.post<{ success: true; data: unknown }>(
    `/admin/reports/${reportId}/resolve`,
    body,
  );
  return response.data.data;
}

export async function fetchAdminUsers(params?: {
  status?: string;
  role?: string;
  q?: string;
  cursor?: string;
}) {
  const response = await apiClient.get<{
    success: true;
    data: AdminUserItem[];
    meta: PaginatedMeta;
  }>("/admin/users", { params });
  return response.data;
}

export async function updateUserStatus(
  userId: string,
  body: { status: "active" | "suspended"; reason?: string },
) {
  const response = await apiClient.patch<{ success: true; data: { id: string; status: string } }>(
    `/admin/users/${userId}/status`,
    body,
  );
  return response.data.data;
}

export async function updateUserRole(userId: string, body: { role: AdminUserRole }) {
  const response = await apiClient.patch<{ success: true; data: { id: string; role: string } }>(
    `/admin/users/${userId}/role`,
    body,
  );
  return response.data.data;
}

export async function fetchAuditLogs(params?: { cursor?: string }) {
  const response = await apiClient.get<{
    success: true;
    data: AuditLogItem[];
    meta: PaginatedMeta;
  }>("/admin/audit-logs", { params });
  return response.data;
}

export interface AdminContentMoodItem {
  id: string;
  contentPreview: string;
  status: string;
  reportCount: number;
  commentCount: number;
  createdAt: string;
}

export interface AdminFacultyItem {
  id: string;
  name: string;
  nameTh: string | null;
  slug: string;
  isActive: boolean;
  approvalStatus: string;
}

export interface AdminMajorItem {
  id: string;
  facultyId: string;
  facultyName: string;
  name: string;
  nameTh: string | null;
  slug: string;
  isActive: boolean;
  approvalStatus: string;
}

export interface AdminMoodTagItem {
  id: string;
  name: string;
  nameTh: string | null;
  slug: string;
  isActive: boolean;
  approvalStatus: string;
}

export type PendingSubmissionType = "faculty" | "major" | "tag";

export interface PendingFacultySubmissionItem {
  id: string;
  type: "faculty";
  name: string;
  nameTh: string | null;
  slug: string;
  approvalStatus: string;
  submittedBy: string | null;
  createdAt: string;
}

export interface PendingMajorSubmissionItem {
  id: string;
  type: "major";
  name: string;
  nameTh: string | null;
  slug: string;
  facultyId: string;
  facultyName: string;
  approvalStatus: string;
  submittedBy: string | null;
  createdAt: string;
}

export interface PendingTagSubmissionItem {
  id: string;
  type: "tag";
  name: string;
  nameTh: string | null;
  slug: string;
  approvalStatus: string;
  submittedBy: string | null;
  createdAt: string;
}

export type PendingSubmissionItem =
  | PendingFacultySubmissionItem
  | PendingMajorSubmissionItem
  | PendingTagSubmissionItem;

export async function fetchAdminContentMoods(params?: {
  status?: string;
  minReportCount?: number;
  cursor?: string;
}) {
  const response = await apiClient.get<{
    success: true;
    data: AdminContentMoodItem[];
    meta: PaginatedMeta;
  }>("/admin/content/moods", { params });
  return response.data;
}

export async function fetchAdminFaculties() {
  const response = await apiClient.get<{ success: true; data: AdminFacultyItem[] }>(
    "/admin/faculties",
  );
  return response.data.data;
}

export async function fetchAdminMajors() {
  const response = await apiClient.get<{ success: true; data: AdminMajorItem[] }>("/admin/majors");
  return response.data.data;
}

export async function fetchAdminMoodTags() {
  const response = await apiClient.get<{ success: true; data: AdminMoodTagItem[] }>(
    "/admin/moods",
  );
  return response.data.data;
}

export async function fetchPendingSubmissions(params?: { type?: PendingSubmissionType }) {
  const response = await apiClient.get<{
    success: true;
    data: PendingSubmissionItem[];
    meta: { pendingCount: number };
  }>("/admin/submissions", { params });
  return response.data;
}

export async function updatePendingSubmission(
  type: PendingSubmissionType,
  id: string,
  body: { name?: string; nameTh?: string | null; facultyId?: string },
) {
  const response = await apiClient.patch<{ success: true; data: PendingSubmissionItem }>(
    `/admin/submissions/${type}/${id}`,
    body,
  );
  return response.data.data;
}

export async function approvePendingSubmission(type: PendingSubmissionType, id: string) {
  const response = await apiClient.post<{ success: true; data: PendingSubmissionItem }>(
    `/admin/submissions/${type}/${id}/approve`,
  );
  return response.data.data;
}

export async function rejectPendingSubmission(type: PendingSubmissionType, id: string) {
  const response = await apiClient.post<{ success: true; data: PendingSubmissionItem }>(
    `/admin/submissions/${type}/${id}/reject`,
  );
  return response.data.data;
}
