import type { CreateUserInput, User, UserStatus } from "../../../domain/entities/User.js";
import type { AdminUserListQuery, IUserRepository } from "../../../domain/ports/IUserRepository.js";
import { UserModel } from "../models/User.js";
import { escapeRegex } from "../../../utils/escapeRegex.js";

function mapUser(doc: {
  _id: { toString(): string };
  email: string;
  studentId?: string | null;
  yearOfStudy?: number | null;
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
    studentId: doc.studentId ?? null,
    yearOfStudy: doc.yearOfStudy ?? null,
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

  async findByStudentId(studentId: string): Promise<User | null> {
    const doc = await UserModel.findOne({
      studentId: studentId.toUpperCase(),
      deletedAt: null,
    });
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
      studentId: input.studentId ? input.studentId.toUpperCase() : null,
      yearOfStudy: input.yearOfStudy ?? null,
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

  async findManyAdmin(query: AdminUserListQuery): Promise<User[]> {
    const filter: Record<string, unknown> = { deletedAt: null };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.role) {
      filter.role = query.role;
    }

    if (query.q) {
      filter.email = { $regex: escapeRegex(query.q.trim()), $options: "i" };
    }

    if (query.cursorCreatedAt && query.cursorId) {
      filter.$or = [
        { createdAt: { $lt: query.cursorCreatedAt } },
        { createdAt: query.cursorCreatedAt, _id: { $lt: query.cursorId } },
      ];
    }

    const docs = await UserModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(query.limit)
      .lean();

    return docs.map(mapUser);
  }

  async updateStatus(id: string, status: UserStatus): Promise<User | null> {
    const doc = await UserModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { status },
      { returnDocument: "after" },
    ).lean();

    return doc ? mapUser(doc) : null;
  }

  async countActiveSince(since: Date): Promise<number> {
    return UserModel.countDocuments({
      deletedAt: null,
      status: "active",
      lastLoginAt: { $gte: since },
    });
  }
}
