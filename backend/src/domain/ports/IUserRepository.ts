import type { CreateUserInput, User } from "../entities/User.js";

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
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
}
