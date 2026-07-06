import { apiClient } from "./apiClient";

export interface AdminDashboard {
  openReports: number;
  actionsToday: number;
  activeUsers24h: number;
  moodsCreated24h: number;
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

export async function fetchAuditLogs(params?: { cursor?: string }) {
  const response = await apiClient.get<{
    success: true;
    data: AuditLogItem[];
    meta: PaginatedMeta;
  }>("/admin/audit-logs", { params });
  return response.data;
}
