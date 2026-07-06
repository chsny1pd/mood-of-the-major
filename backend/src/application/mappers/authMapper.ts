import type { User } from "../../domain/entities/User.js";
import type { UserProfile } from "../services/AuthService.js";

export function toAuthUserDto(user: User) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    facultyId: user.facultyId,
    majorId: user.majorId,
  };
}

export function toUserProfileDto(profile: UserProfile) {
  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    facultyId: profile.facultyId,
    majorId: profile.majorId,
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
