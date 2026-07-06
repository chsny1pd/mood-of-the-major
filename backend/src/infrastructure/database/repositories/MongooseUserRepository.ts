import type { CreateUserInput, User } from "../../../domain/entities/User.js";
import type { IUserRepository } from "../../../domain/ports/IUserRepository.js";
import { UserModel } from "../models/User.js";

function mapUser(doc: {
  _id: { toString(): string };
  email: string;
  passwordHash: string;
  role: User["role"];
  facultyId?: { toString(): string } | null;
  majorId?: { toString(): string } | null;
  status: User["status"];
  tokenVersion: number;
  refreshTokenHash?: string | null;
  refreshTokenExpiresAt?: Date | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}): User {
  return {
    id: doc._id.toString(),
    email: doc.email,
    passwordHash: doc.passwordHash,
    role: doc.role,
    facultyId: doc.facultyId ? doc.facultyId.toString() : null,
    majorId: doc.majorId ? doc.majorId.toString() : null,
    status: doc.status,
    tokenVersion: doc.tokenVersion,
    refreshTokenHash: doc.refreshTokenHash ?? null,
    refreshTokenExpiresAt: doc.refreshTokenExpiresAt ?? null,
    lastLoginAt: doc.lastLoginAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt ?? null,
  };
}

export class MongooseUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase(), deletedAt: null });
    return doc ? mapUser(doc) : null;
  }

  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findOne({ _id: id, deletedAt: null });
    return doc ? mapUser(doc) : null;
  }

  async findByRefreshTokenHash(hash: string): Promise<User | null> {
    const doc = await UserModel.findOne({ refreshTokenHash: hash, deletedAt: null });
    return doc ? mapUser(doc) : null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const doc = await UserModel.create({
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      role: input.role ?? "student",
      facultyId: input.facultyId ?? null,
      majorId: input.majorId ?? null,
      status: "active",
    });

    return mapUser(doc);
  }

  async updateLastLoginAt(id: string, at: Date): Promise<void> {
    await UserModel.updateOne({ _id: id }, { lastLoginAt: at });
  }

  async updateRefreshSession(
    id: string,
    refreshTokenHash: string | null,
    refreshTokenExpiresAt: Date | null,
  ): Promise<void> {
    await UserModel.updateOne(
      { _id: id },
      { refreshTokenHash, refreshTokenExpiresAt },
    );
  }

  async incrementTokenVersion(id: string): Promise<number> {
    const doc = await UserModel.findOneAndUpdate(
      { _id: id },
      { $inc: { tokenVersion: 1 } },
      { returnDocument: "after" },
    );

    return doc?.tokenVersion ?? 0;
  }

  async clearRefreshSession(id: string): Promise<void> {
    await UserModel.updateOne(
      { _id: id },
      { refreshTokenHash: null, refreshTokenExpiresAt: null },
    );
  }
}
