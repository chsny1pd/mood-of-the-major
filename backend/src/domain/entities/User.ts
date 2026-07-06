export type UserRole = "student" | "administrator" | "advisor";
export type UserStatus = "active" | "suspended";

export interface User {
  id: string;
  email: string;
  studentId: string | null;
  yearOfStudy: number | null;
  passwordHash: string;
  role: UserRole;
  facultyId: string | null;
  majorId: string | null;
  status: UserStatus;
  tokenVersion: number;
  refreshTokenHash: string | null;
  refreshTokenExpiresAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  studentId?: string | null;
  yearOfStudy?: number | null;
  role?: UserRole;
  facultyId?: string | null;
  majorId?: string | null;
}
