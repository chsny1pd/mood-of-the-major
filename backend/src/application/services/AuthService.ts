import type { User } from "../../domain/entities/User.js";
import type { IFacultyRepository } from "../../domain/ports/IFacultyRepository.js";
import type { IPasswordHasher } from "../../domain/ports/IPasswordHasher.js";
import type { ITokenService } from "../../domain/ports/ITokenService.js";
import type { IUserRepository } from "../../domain/ports/IUserRepository.js";
import {
  AppError,
  AuthenticationError,
  ValidationError,
} from "../../domain/errors/AppError.js";
import type { Env } from "../../config/env.js";

export interface RegisterInput {
  email: string;
  password: string;
  studentId: string;
  yearOfStudy: number;
  facultyId?: string;
  majorId?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface RefreshResult {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  studentId: string | null;
  yearOfStudy: number | null;
  role: User["role"];
  facultyId: string | null;
  majorId: string | null;
  faculty: { id: string; name: string; slug: string } | null;
  major: { id: string; name: string; slug: string } | null;
  createdAt: Date;
}

export class AuthService {
  constructor(
    private readonly users: IUserRepository,
    private readonly faculties: IFacultyRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokens: ITokenService,
    private readonly env: Env,
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    const studentId = input.studentId.trim().toUpperCase();
    this.assertEmailAllowed(email);
    await this.validateAffiliation(input.facultyId, input.majorId);

    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new AppError("Email already registered", {
        statusCode: 422,
        code: "EMAIL_ALREADY_EXISTS",
        details: [{ field: "email", message: "An account with this email already exists." }],
      });
    }

    const existingStudentId = await this.users.findByStudentId(studentId);
    if (existingStudentId) {
      throw new AppError("Student ID already registered", {
        statusCode: 422,
        code: "STUDENT_ID_ALREADY_EXISTS",
        details: [{ field: "studentId", message: "An account with this student ID already exists." }],
      });
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.users.create({
      email,
      studentId,
      yearOfStudy: input.yearOfStudy,
      passwordHash,
      facultyId: input.facultyId ?? null,
      majorId: input.majorId ?? null,
    });

    return this.issueSession(user);
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    const user = await this.users.findByEmail(email);

    if (!user) {
      throw new AuthenticationError(
        "Invalid email or password",
        "AUTH_INVALID_CREDENTIALS",
      );
    }

    if (user.status === "suspended") {
      throw new AuthenticationError("Account suspended", "ACCOUNT_SUSPENDED", 403);
    }

    const validPassword = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );

    if (!validPassword) {
      throw new AuthenticationError(
        "Invalid email or password",
        "AUTH_INVALID_CREDENTIALS",
      );
    }

    await this.users.updateLastLoginAt(user.id, new Date());

    return this.issueSession(user);
  }

  async refresh(refreshToken: string): Promise<RefreshResult> {
    const hash = this.tokens.hashRefreshToken(refreshToken);
    const user = await this.users.findByRefreshTokenHash(hash);

    if (!user) {
      throw new AuthenticationError("Invalid refresh token", "AUTH_INVALID_TOKEN");
    }

    if (
      !user.refreshTokenExpiresAt ||
      user.refreshTokenExpiresAt.getTime() <= Date.now()
    ) {
      await this.users.clearRefreshSession(user.id);
      throw new AuthenticationError("Refresh token expired", "AUTH_EXPIRED_TOKEN");
    }

    if (user.status !== "active") {
      throw new AuthenticationError("Account suspended", "ACCOUNT_SUSPENDED", 403);
    }

    const pair = this.tokens.issueTokenPair(user.id, user.role, user.tokenVersion);
    await this.users.updateRefreshSession(
      user.id,
      this.tokens.hashRefreshToken(pair.refreshToken),
      pair.refreshTokenExpiresAt,
    );

    return {
      accessToken: pair.accessToken,
      expiresIn: pair.expiresIn,
      refreshToken: pair.refreshToken,
      refreshTokenExpiresAt: pair.refreshTokenExpiresAt,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.users.clearRefreshSession(userId);
    await this.users.incrementTokenVersion(userId);
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new AuthenticationError("Invalid token", "AUTH_INVALID_TOKEN");
    }

    return this.buildProfile(user);
  }

  private async issueSession(user: User): Promise<AuthResult> {
    const pair = this.tokens.issueTokenPair(user.id, user.role, user.tokenVersion);

    await this.users.updateRefreshSession(
      user.id,
      this.tokens.hashRefreshToken(pair.refreshToken),
      pair.refreshTokenExpiresAt,
    );

    return {
      user,
      accessToken: pair.accessToken,
      expiresIn: pair.expiresIn,
      refreshToken: pair.refreshToken,
      refreshTokenExpiresAt: pair.refreshTokenExpiresAt,
    };
  }

  private async buildProfile(user: User): Promise<UserProfile> {
    const faculty = user.facultyId
      ? await this.faculties.findActiveById(user.facultyId)
      : null;
    const major =
      user.majorId && user.facultyId
        ? await this.faculties.findActiveMajorById(user.majorId, user.facultyId)
        : null;

    return {
      id: user.id,
      email: user.email,
      studentId: user.studentId,
      yearOfStudy: user.yearOfStudy,
      role: user.role,
      facultyId: user.facultyId,
      majorId: user.majorId,
      faculty,
      major: major
        ? { id: major.id, name: major.name, slug: major.slug }
        : null,
      createdAt: user.createdAt,
    };
  }

  private assertEmailAllowed(email: string): void {
    const domains = this.env.ALLOWED_EMAIL_DOMAINS?.split(",")
      .map((domain) => domain.trim().toLowerCase())
      .filter(Boolean);

    if (!domains?.length) {
      return;
    }

    const emailDomain = email.split("@")[1]?.toLowerCase();
    if (!emailDomain || !domains.includes(emailDomain)) {
      throw new AppError("Email domain not allowed", {
        statusCode: 422,
        code: "EMAIL_DOMAIN_NOT_ALLOWED",
        details: [{ field: "email", message: "Registration is limited to approved email domains." }],
      });
    }
  }

  private async validateAffiliation(facultyId?: string, majorId?: string): Promise<void> {
    if (majorId && !facultyId) {
      throw new ValidationError("Validation failed", [
        { field: "facultyId", message: "Faculty is required when major is provided." },
      ]);
    }

    if (facultyId) {
      const faculty = await this.faculties.findActiveById(facultyId);
      if (!faculty) {
        throw new ValidationError("Validation failed", [
          { field: "facultyId", message: "Invalid faculty." },
        ]);
      }
    }

    if (majorId && facultyId) {
      const major = await this.faculties.findActiveMajorById(majorId, facultyId);
      if (!major) {
        throw new ValidationError("Validation failed", [
          { field: "majorId", message: "Invalid major for selected faculty." },
        ]);
      }
    }
  }
}
