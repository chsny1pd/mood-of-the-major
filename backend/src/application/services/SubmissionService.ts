import { ConflictError, ValidationError } from "../../domain/errors/AppError.js";
import type { ISubmissionRepository } from "../../domain/ports/ISubmissionRepository.js";
import type { SubmissionType } from "../../domain/constants/approvalConstants.js";

const NAME_MIN = 2;
const NAME_MAX = 120;

function validateName(name: string, field: string): string {
  const trimmed = name.trim();
  if (trimmed.length < NAME_MIN || trimmed.length > NAME_MAX) {
    throw new ValidationError("Invalid name", [
      { field, message: `Name must be between ${NAME_MIN} and ${NAME_MAX} characters.` },
    ]);
  }
  return trimmed;
}

export class SubmissionService {
  constructor(private readonly submissions: ISubmissionRepository) {}

  async submitFaculty(userId: string, input: { name: string; nameTh?: string | null }) {
    const name = validateName(input.name, "name");

    if (await this.submissions.facultyNameExists(name)) {
      throw new ConflictError("Faculty name already exists", "DUPLICATE_NAME");
    }

    return this.submissions.submitFaculty({
      name,
      nameTh: input.nameTh ?? null,
      submittedBy: userId,
    });
  }

  async submitMajor(
    userId: string,
    input: { facultyId: string; name: string; nameTh?: string | null },
  ) {
    const name = validateName(input.name, "name");

    if (await this.submissions.majorNameExists(input.facultyId, name)) {
      throw new ConflictError("Major name already exists for this faculty", "DUPLICATE_NAME");
    }

    return this.submissions.submitMajor({
      facultyId: input.facultyId,
      name,
      nameTh: input.nameTh ?? null,
      submittedBy: userId,
    });
  }

  async submitTag(
    userId: string,
    input: { name: string; nameTh?: string | null; iconKey?: string | null },
  ) {
    const name = validateName(input.name, "name");

    if (await this.submissions.tagNameExists(name)) {
      throw new ConflictError("Mood name already exists", "DUPLICATE_NAME");
    }

    return this.submissions.submitTag({
      name,
      nameTh: input.nameTh ?? null,
      iconKey: input.iconKey?.trim() || null,
      submittedBy: userId,
    });
  }

  listPending(type?: SubmissionType) {
    return this.submissions.findPending(type);
  }

  updatePending(
    type: SubmissionType,
    id: string,
    input: { name?: string; nameTh?: string | null; facultyId?: string; iconKey?: string | null },
  ) {
    const patch: {
      name?: string;
      nameTh?: string | null;
      facultyId?: string;
      iconKey?: string | null;
    } = {};

    if (input.name !== undefined) {
      patch.name = validateName(input.name, "name");
    }

    if (input.nameTh !== undefined) {
      patch.nameTh = input.nameTh?.trim() ?? null;
    }

    if (input.facultyId !== undefined) {
      patch.facultyId = input.facultyId;
    }

    if (input.iconKey !== undefined) {
      patch.iconKey = input.iconKey?.trim() || null;
    }

    return this.submissions.updatePending(type, id, patch);
  }

  approve(type: SubmissionType, id: string) {
    return this.submissions.approve(type, id);
  }

  reject(type: SubmissionType, id: string) {
    return this.submissions.reject(type, id);
  }

  listFacultiesAdmin() {
    return this.submissions.listApprovedFacultiesAdmin();
  }

  listMajorsAdmin() {
    return this.submissions.listApprovedMajorsAdmin();
  }

  listTagsAdmin() {
    return this.submissions.listApprovedTagsAdmin();
  }

  countPending() {
    return this.submissions.countPending();
  }

  countApprovedFaculties() {
    return this.submissions.countApprovedFaculties();
  }

  countApprovedMajors() {
    return this.submissions.countApprovedMajors();
  }

  countApprovedTags() {
    return this.submissions.countApprovedTags();
  }
}
