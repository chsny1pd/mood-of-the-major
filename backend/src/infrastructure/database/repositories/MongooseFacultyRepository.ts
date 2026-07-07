import type { IFacultyRepository, FacultySummary } from "../../../domain/ports/IFacultyRepository.js";
import { FacultyModel } from "../models/Faculty.js";
import { MajorModel } from "../models/Major.js";

function isObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}

export class MongooseFacultyRepository implements IFacultyRepository {
  async findAllActive(): Promise<FacultySummary[]> {
    const faculties = await FacultyModel.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    const summaries: FacultySummary[] = [];

    for (const faculty of faculties) {
      const majorCount = await MajorModel.countDocuments({
        facultyId: faculty._id,
        isActive: true,
      });

      summaries.push({
        id: faculty._id.toString(),
        name: faculty.name,
        nameTh: faculty.nameTh ?? null,
        slug: faculty.slug,
        code: faculty.code ?? null,
        majorCount,
      });
    }

    return summaries;
  }

  async findActiveById(idOrSlug: string) {
    const filter = isObjectId(idOrSlug)
      ? { _id: idOrSlug, isActive: true }
      : { slug: idOrSlug.toLowerCase(), isActive: true };

    const faculty = await FacultyModel.findOne(filter).lean();
    if (!faculty) return null;

    return {
      id: faculty._id.toString(),
      name: faculty.name,
      nameTh: faculty.nameTh ?? null,
      slug: faculty.slug,
    };
  }

  async findActiveMajorByIdOnly(majorIdOrSlug: string) {
    const filter = isObjectId(majorIdOrSlug)
      ? { _id: majorIdOrSlug, isActive: true }
      : { slug: majorIdOrSlug.toLowerCase(), isActive: true };

    const major = await MajorModel.findOne(filter).lean();
    if (!major) return null;

    return {
      id: major._id.toString(),
      name: major.name,
      nameTh: major.nameTh ?? null,
      slug: major.slug,
      code: major.code ?? null,
      facultyId: major.facultyId.toString(),
    };
  }

  async findActiveMajorById(majorId: string, facultyId: string) {
    const major = await MajorModel.findOne({
      _id: majorId,
      facultyId,
      isActive: true,
    }).lean();

    if (!major) return null;

    return {
      id: major._id.toString(),
      name: major.name,
      nameTh: major.nameTh ?? null,
      slug: major.slug,
      code: major.code ?? null,
    };
  }

  async findActiveMajorsByFacultyId(facultyIdOrSlug: string) {
    const faculty = await this.findActiveById(facultyIdOrSlug);
    if (!faculty) return [];

    const majors = await MajorModel.find({ facultyId: faculty.id, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return majors.map((major) => ({
      id: major._id.toString(),
      name: major.name,
      nameTh: major.nameTh ?? null,
      slug: major.slug,
      code: major.code ?? null,
    }));
  }

  async countActiveMajorsByFacultyId(facultyIdOrSlug: string): Promise<number> {
    const faculty = await this.findActiveById(facultyIdOrSlug);
    if (!faculty) return 0;

    return MajorModel.countDocuments({ facultyId: faculty.id, isActive: true });
  }
}
