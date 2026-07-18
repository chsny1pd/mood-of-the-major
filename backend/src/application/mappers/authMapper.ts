import type { User } from "../../domain/entities/User.js";
import type { UserProfile } from "../services/AuthService.js";

export function toAuthUserDto(user: User) {
  return {
    id: user.id,
    email: user.email,
    studentId: user.studentId,
    yearOfStudy: user.yearOfStudy,
    role: user.role,
    facultyId: user.facultyId,
    majorId: user.majorId,
    displayName: user.displayName,
    realName: user.realName,
    birthYear: user.birthYear,
    avatarUrl: user.avatarUrl,
  };
}

export function toUserProfileDto(profile: UserProfile) {
  return {
    id: profile.id,
    email: profile.email,
    studentId: profile.studentId,
    yearOfStudy: profile.yearOfStudy,
    role: profile.role,
    facultyId: profile.facultyId,
    majorId: profile.majorId,
    displayName: profile.displayName,
    realName: profile.realName,
    birthYear: profile.birthYear,
    avatarUrl: profile.avatarUrl,
    faculty: profile.faculty,
    major: profile.major,
    createdAt: profile.createdAt.toISOString(),
  };
}

export function toTokenDto(accessToken: string, expiresIn: number) {
  return {
    accessToken,
    expiresIn,
  };
}
