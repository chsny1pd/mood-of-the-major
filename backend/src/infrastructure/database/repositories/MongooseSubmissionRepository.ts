import type { ApprovalStatus, SubmissionType } from "../../../domain/constants/approvalConstants.js";
import { ConflictError, NotFoundError } from "../../../domain/errors/AppError.js";
import type {
  ISubmissionRepository,
  PendingFacultySubmission,
  PendingMajorSubmission,
  PendingSubmission,
  PendingTagSubmission,
  SubmitFacultyInput,
  SubmitMajorInput,
  SubmitTagInput,
  UpdatePendingSubmissionInput,
} from "../../../domain/ports/ISubmissionRepository.js";
import { FacultyModel } from "../models/Faculty.js";
import { MajorModel } from "../models/Major.js";
import { TagModel } from "../models/Tag.js";
import { slugifyName, uniqueSlug } from "../../../utils/slugify.js";
import { escapeRegex } from "../../../utils/escapeRegex.js";

function normalizeName(value: string): string {
  return value.trim();
}

export class MongooseSubmissionRepository implements ISubmissionRepository {
  async facultyNameExists(name: string): Promise<boolean> {
    const pattern = new RegExp(`^${escapeRegex(normalizeName(name))}$`, "i");
    const existing = await FacultyModel.findOne({ name: pattern }).lean();
    return Boolean(existing);
  }

  async majorNameExists(facultyId: string, name: string): Promise<boolean> {
    const pattern = new RegExp(`^${escapeRegex(normalizeName(name))}$`, "i");
    const existing = await MajorModel.findOne({ facultyId, name: pattern }).lean();
    return Boolean(existing);
  }

  async tagNameExists(name: string): Promise<boolean> {
    const pattern = new RegExp(`^${escapeRegex(normalizeName(name))}$`, "i");
    const existing = await TagModel.findOne({ type: "emotion", name: pattern }).lean();
    return Boolean(existing);
  }

  async slugExists(type: SubmissionType, slug: string, facultyId?: string): Promise<boolean> {
    if (type === "faculty") {
      return Boolean(await FacultyModel.findOne({ slug }).lean());
    }

    if (type === "major") {
      return Boolean(await MajorModel.findOne({ facultyId, slug }).lean());
    }

    return Boolean(await TagModel.findOne({ type: "emotion", slug }).lean());
  }

  async submitFaculty(input: SubmitFacultyInput): Promise<PendingFacultySubmission> {
    const name = normalizeName(input.name);
    const slug = await uniqueSlug(slugifyName(name), (candidate) => this.slugExists("faculty", candidate));

    const doc = await FacultyModel.create({
      name,
      nameTh: input.nameTh?.trim() ?? null,
      slug,
      isActive: false,
      approvalStatus: "pending",
      submittedBy: input.submittedBy,
    });

    return {
      id: doc._id.toString(),
      type: "faculty",
      name: doc.name,
      nameTh: doc.nameTh ?? null,
      slug: doc.slug,
      approvalStatus: "pending",
      submittedBy: input.submittedBy,
      createdAt: doc.createdAt,
    };
  }

  async submitMajor(input: SubmitMajorInput): Promise<PendingMajorSubmission> {
    const faculty = await FacultyModel.findOne({
      _id: input.facultyId,
      approvalStatus: "approved",
      isActive: true,
    }).lean();

    if (!faculty) {
      throw new NotFoundError("Faculty not found", "RESOURCE_NOT_FOUND");
    }

    const name = normalizeName(input.name);
    const slug = await uniqueSlug(slugifyName(name), (candidate) =>
      this.slugExists("major", candidate, input.facultyId),
    );

    const doc = await MajorModel.create({
      facultyId: input.facultyId,
      name,
      nameTh: input.nameTh?.trim() ?? null,
      slug,
      isActive: false,
      approvalStatus: "pending",
      submittedBy: input.submittedBy,
    });

    return {
      id: doc._id.toString(),
      type: "major",
      name: doc.name,
      nameTh: doc.nameTh ?? null,
      slug: doc.slug,
      facultyId: faculty._id.toString(),
      facultyName: faculty.name,
      approvalStatus: "pending",
      submittedBy: input.submittedBy,
      createdAt: doc.createdAt,
    };
  }

  async submitTag(input: SubmitTagInput): Promise<PendingTagSubmission> {
    const name = normalizeName(input.name);
    const slug = await uniqueSlug(slugifyName(name), (candidate) => this.slugExists("tag", candidate));

    const doc = await TagModel.create({
      name,
      nameTh: input.nameTh?.trim() ?? null,
      slug,
      type: "emotion",
      isActive: false,
      approvalStatus: "pending",
      submittedBy: input.submittedBy,
    });

    return {
      id: doc._id.toString(),
      type: "tag",
      name: doc.name,
      nameTh: doc.nameTh ?? null,
      slug: doc.slug,
      approvalStatus: "pending",
      submittedBy: input.submittedBy,
      createdAt: doc.createdAt,
    };
  }

  async findPending(type?: SubmissionType): Promise<PendingSubmission[]> {
    const results: PendingSubmission[] = [];

    if (!type || type === "faculty") {
      const faculties = await FacultyModel.find({ approvalStatus: "pending" })
        .sort({ createdAt: -1 })
        .lean();

      results.push(
        ...faculties.map((faculty) => ({
          id: faculty._id.toString(),
          type: "faculty" as const,
          name: faculty.name,
          nameTh: faculty.nameTh ?? null,
          slug: faculty.slug,
          approvalStatus: faculty.approvalStatus as ApprovalStatus,
          submittedBy: faculty.submittedBy?.toString() ?? null,
          createdAt: faculty.createdAt,
        })),
      );
    }

    if (!type || type === "major") {
      const majors = await MajorModel.find({ approvalStatus: "pending" })
        .sort({ createdAt: -1 })
        .lean();

      const facultyIds = [...new Set(majors.map((major) => major.facultyId.toString()))];
      const faculties = facultyIds.length
        ? await FacultyModel.find({ _id: { $in: facultyIds } }).lean()
        : [];
      const facultyMap = new Map(faculties.map((faculty) => [faculty._id.toString(), faculty.name]));

      results.push(
        ...majors.map((major) => ({
          id: major._id.toString(),
          type: "major" as const,
          name: major.name,
          nameTh: major.nameTh ?? null,
          slug: major.slug,
          facultyId: major.facultyId.toString(),
          facultyName: facultyMap.get(major.facultyId.toString()) ?? "Unknown",
          approvalStatus: major.approvalStatus as ApprovalStatus,
          submittedBy: major.submittedBy?.toString() ?? null,
          createdAt: major.createdAt,
        })),
      );
    }

    if (!type || type === "tag") {
      const tags = await TagModel.find({ type: "emotion", approvalStatus: "pending" })
        .sort({ createdAt: -1 })
        .lean();

      results.push(
        ...tags.map((tag) => ({
          id: tag._id.toString(),
          type: "tag" as const,
          name: tag.name,
          nameTh: tag.nameTh ?? null,
          slug: tag.slug,
          approvalStatus: tag.approvalStatus as ApprovalStatus,
          submittedBy: tag.submittedBy?.toString() ?? null,
          createdAt: tag.createdAt,
        })),
      );
    }

    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async countPending(): Promise<number> {
    const [faculties, majors, tags] = await Promise.all([
      FacultyModel.countDocuments({ approvalStatus: "pending" }),
      MajorModel.countDocuments({ approvalStatus: "pending" }),
      TagModel.countDocuments({ type: "emotion", approvalStatus: "pending" }),
    ]);

    return faculties + majors + tags;
  }

  async countApprovedFaculties(): Promise<number> {
    return FacultyModel.countDocuments({ approvalStatus: "approved", isActive: true });
  }

  async countApprovedMajors(): Promise<number> {
    return MajorModel.countDocuments({ approvalStatus: "approved", isActive: true });
  }

  async countApprovedTags(): Promise<number> {
    return TagModel.countDocuments({ type: "emotion", approvalStatus: "approved", isActive: true });
  }

  private async findFacultyPending(id: string): Promise<PendingFacultySubmission | null> {
    const faculty = await FacultyModel.findOne({ _id: id, approvalStatus: "pending" }).lean();
    if (!faculty) return null;

    return {
      id: faculty._id.toString(),
      type: "faculty",
      name: faculty.name,
      nameTh: faculty.nameTh ?? null,
      slug: faculty.slug,
      approvalStatus: faculty.approvalStatus as ApprovalStatus,
      submittedBy: faculty.submittedBy?.toString() ?? null,
      createdAt: faculty.createdAt,
    };
  }

  private async findMajorPending(id: string): Promise<PendingMajorSubmission | null> {
    const major = await MajorModel.findOne({ _id: id, approvalStatus: "pending" }).lean();
    if (!major) return null;

    const faculty = await FacultyModel.findById(major.facultyId).lean();

    return {
      id: major._id.toString(),
      type: "major",
      name: major.name,
      nameTh: major.nameTh ?? null,
      slug: major.slug,
      facultyId: major.facultyId.toString(),
      facultyName: faculty?.name ?? "Unknown",
      approvalStatus: major.approvalStatus as ApprovalStatus,
      submittedBy: major.submittedBy?.toString() ?? null,
      createdAt: major.createdAt,
    };
  }

  private async findTagPending(id: string): Promise<PendingTagSubmission | null> {
    const tag = await TagModel.findOne({ _id: id, type: "emotion", approvalStatus: "pending" }).lean();
    if (!tag) return null;

    return {
      id: tag._id.toString(),
      type: "tag",
      name: tag.name,
      nameTh: tag.nameTh ?? null,
      slug: tag.slug,
      approvalStatus: tag.approvalStatus as ApprovalStatus,
      submittedBy: tag.submittedBy?.toString() ?? null,
      createdAt: tag.createdAt,
    };
  }

  async findPendingById(type: SubmissionType, id: string): Promise<PendingSubmission | null> {
    if (type === "faculty") return this.findFacultyPending(id);
    if (type === "major") return this.findMajorPending(id);
    return this.findTagPending(id);
  }

  async updatePending(
    type: SubmissionType,
    id: string,
    input: UpdatePendingSubmissionInput,
  ): Promise<PendingSubmission | null> {
    if (type === "faculty") {
      const patch: Record<string, unknown> = {};
      if (input.name) {
        if (await this.facultyNameExists(input.name)) {
          throw new ConflictError("Faculty name already exists", "DUPLICATE_NAME");
        }
        patch.name = normalizeName(input.name);
        patch.slug = await uniqueSlug(slugifyName(input.name), (candidate) =>
          this.slugExists("faculty", candidate),
        );
      }
      if (input.nameTh !== undefined) patch.nameTh = input.nameTh?.trim() ?? null;

      await FacultyModel.updateOne({ _id: id, approvalStatus: "pending" }, patch);
      return this.findFacultyPending(id);
    }

    if (type === "major") {
      const patch: Record<string, unknown> = {};
      const existing = await MajorModel.findOne({ _id: id, approvalStatus: "pending" }).lean();
      if (!existing) return null;

      const facultyId = input.facultyId ?? existing.facultyId.toString();

      if (input.facultyId) {
        const faculty = await FacultyModel.findOne({
          _id: input.facultyId,
          approvalStatus: "approved",
          isActive: true,
        }).lean();
        if (!faculty) {
          throw new NotFoundError("Faculty not found", "RESOURCE_NOT_FOUND");
        }
        patch.facultyId = input.facultyId;
      }

      if (input.name) {
        if (await this.majorNameExists(facultyId, input.name)) {
          throw new ConflictError("Major name already exists for this faculty", "DUPLICATE_NAME");
        }
        patch.name = normalizeName(input.name);
        patch.slug = await uniqueSlug(slugifyName(input.name), (candidate) =>
          this.slugExists("major", candidate, facultyId),
        );
      }

      if (input.nameTh !== undefined) patch.nameTh = input.nameTh?.trim() ?? null;

      await MajorModel.updateOne({ _id: id, approvalStatus: "pending" }, patch);
      return this.findMajorPending(id);
    }

    const patch: Record<string, unknown> = {};
    if (input.name) {
      if (await this.tagNameExists(input.name)) {
        throw new ConflictError("Mood name already exists", "DUPLICATE_NAME");
      }
      patch.name = normalizeName(input.name);
      patch.slug = await uniqueSlug(slugifyName(input.name), (candidate) =>
        this.slugExists("tag", candidate),
      );
    }
    if (input.nameTh !== undefined) patch.nameTh = input.nameTh?.trim() ?? null;

    await TagModel.updateOne({ _id: id, type: "emotion", approvalStatus: "pending" }, patch);
    return this.findTagPending(id);
  }

  async approve(type: SubmissionType, id: string): Promise<PendingSubmission | null> {
    if (type === "faculty") {
      const doc = await FacultyModel.findOneAndUpdate(
        { _id: id, approvalStatus: "pending" },
        { approvalStatus: "approved", isActive: true },
        { returnDocument: "after" },
      ).lean();
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        type: "faculty",
        name: doc.name,
        nameTh: doc.nameTh ?? null,
        slug: doc.slug,
        approvalStatus: "approved",
        submittedBy: doc.submittedBy?.toString() ?? null,
        createdAt: doc.createdAt,
      };
    }

    if (type === "major") {
      const doc = await MajorModel.findOneAndUpdate(
        { _id: id, approvalStatus: "pending" },
        { approvalStatus: "approved", isActive: true },
        { returnDocument: "after" },
      ).lean();
      if (!doc) return null;
      const faculty = await FacultyModel.findById(doc.facultyId).lean();
      return {
        id: doc._id.toString(),
        type: "major",
        name: doc.name,
        nameTh: doc.nameTh ?? null,
        slug: doc.slug,
        facultyId: doc.facultyId.toString(),
        facultyName: faculty?.name ?? "Unknown",
        approvalStatus: "approved",
        submittedBy: doc.submittedBy?.toString() ?? null,
        createdAt: doc.createdAt,
      };
    }

    const doc = await TagModel.findOneAndUpdate(
      { _id: id, type: "emotion", approvalStatus: "pending" },
      { approvalStatus: "approved", isActive: true },
      { returnDocument: "after" },
    ).lean();

    if (!doc) return null;

    return {
      id: doc._id.toString(),
      type: "tag",
      name: doc.name,
      nameTh: doc.nameTh ?? null,
      slug: doc.slug,
      approvalStatus: "approved",
      submittedBy: doc.submittedBy?.toString() ?? null,
      createdAt: doc.createdAt,
    };
  }

  async reject(type: SubmissionType, id: string): Promise<PendingSubmission | null> {
    if (type === "faculty") {
      const doc = await FacultyModel.findOneAndUpdate(
        { _id: id, approvalStatus: "pending" },
        { approvalStatus: "rejected", isActive: false },
        { returnDocument: "after" },
      ).lean();
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        type: "faculty",
        name: doc.name,
        nameTh: doc.nameTh ?? null,
        slug: doc.slug,
        approvalStatus: "rejected",
        submittedBy: doc.submittedBy?.toString() ?? null,
        createdAt: doc.createdAt,
      };
    }

    if (type === "major") {
      const doc = await MajorModel.findOneAndUpdate(
        { _id: id, approvalStatus: "pending" },
        { approvalStatus: "rejected", isActive: false },
        { returnDocument: "after" },
      ).lean();
      if (!doc) return null;
      const faculty = await FacultyModel.findById(doc.facultyId).lean();
      return {
        id: doc._id.toString(),
        type: "major",
        name: doc.name,
        nameTh: doc.nameTh ?? null,
        slug: doc.slug,
        facultyId: doc.facultyId.toString(),
        facultyName: faculty?.name ?? "Unknown",
        approvalStatus: "rejected",
        submittedBy: doc.submittedBy?.toString() ?? null,
        createdAt: doc.createdAt,
      };
    }

    const doc = await TagModel.findOneAndUpdate(
      { _id: id, type: "emotion", approvalStatus: "pending" },
      { approvalStatus: "rejected", isActive: false },
      { returnDocument: "after" },
    ).lean();

    if (!doc) return null;

    return {
      id: doc._id.toString(),
      type: "tag",
      name: doc.name,
      nameTh: doc.nameTh ?? null,
      slug: doc.slug,
      approvalStatus: "rejected",
      submittedBy: doc.submittedBy?.toString() ?? null,
      createdAt: doc.createdAt,
    };
  }

  async listApprovedFacultiesAdmin() {
    const faculties = await FacultyModel.find().sort({ sortOrder: 1, name: 1 }).lean();
    return faculties.map((faculty) => ({
      id: faculty._id.toString(),
      name: faculty.name,
      nameTh: faculty.nameTh ?? null,
      slug: faculty.slug,
      isActive: faculty.isActive,
      approvalStatus: faculty.approvalStatus as ApprovalStatus,
    }));
  }

  async listApprovedMajorsAdmin() {
    const majors = await MajorModel.find().sort({ sortOrder: 1, name: 1 }).lean();
    const facultyIds = [...new Set(majors.map((major) => major.facultyId.toString()))];
    const faculties = facultyIds.length
      ? await FacultyModel.find({ _id: { $in: facultyIds } }).lean()
      : [];
    const facultyMap = new Map(faculties.map((faculty) => [faculty._id.toString(), faculty.name]));

    return majors.map((major) => ({
      id: major._id.toString(),
      facultyId: major.facultyId.toString(),
      facultyName: facultyMap.get(major.facultyId.toString()) ?? "Unknown",
      name: major.name,
      nameTh: major.nameTh ?? null,
      slug: major.slug,
      isActive: major.isActive,
      approvalStatus: major.approvalStatus as ApprovalStatus,
    }));
  }

  async listApprovedTagsAdmin() {
    const tags = await TagModel.find({ type: "emotion" }).sort({ sortOrder: 1, name: 1 }).lean();
    return tags.map((tag) => ({
      id: tag._id.toString(),
      name: tag.name,
      nameTh: tag.nameTh ?? null,
      slug: tag.slug,
      isActive: tag.isActive,
      approvalStatus: tag.approvalStatus as ApprovalStatus,
    }));
  }
}
