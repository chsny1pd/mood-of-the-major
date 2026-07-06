import type { CreateUserInput, User, UserRole, UserStatus } from "../entities/User.js";

export interface AdminUserListQuery {
  status?: UserStatus;
  role?: UserRole;
  q?: string;
  limit: number;
  cursorCreatedAt?: Date;
  cursorId?: string;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findByStudentId(studentId: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByRefreshTokenHash(hash: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  updateLastLoginAt(id: string, at: Date): Promise<void>;
  updateRefreshSession(
    id: string,
    refreshTokenHash: string | null,
    refreshTokenExpiresAt: Date | null,
  ): Promise<void>;
  incrementTokenVersion(id: string): Promise<number>;
  clearRefreshSession(id: string): Promise<void>;
  findManyAdmin(query: AdminUserListQuery): Promise<User[]>;
  updateStatus(id: string, status: UserStatus): Promise<User | null>;
  countActiveSince(since: Date): Promise<number>;
}
