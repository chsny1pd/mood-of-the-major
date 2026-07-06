import type { IFacultyRepository, FacultySummary } from "../../../domain/ports/IFacultyRepository.js";
import { FacultyModel } from "../models/Faculty.js";
import { MajorModel } from "../models/Major.js";

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
        slug: faculty.slug,
        code: faculty.code ?? null,
        majorCount,
      });
    }

    return summaries;
  }

  async findActiveById(id: string) {
    const faculty = await FacultyModel.findOne({ _id: id, isActive: true }).lean();
    if (!faculty) return null;

    return {
      id: faculty._id.toString(),
      name: faculty.name,
      slug: faculty.slug,
    };
  }

  async findActiveMajorByIdOnly(majorId: string) {
    const major = await MajorModel.findOne({ _id: majorId, isActive: true }).lean();
    if (!major) return null;

    return {
      id: major._id.toString(),
      name: major.name,
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
      slug: major.slug,
      code: major.code ?? null,
    };
  }

  async findActiveMajorsByFacultyId(facultyId: string) {
    const majors = await MajorModel.find({ facultyId, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return majors.map((major) => ({
      id: major._id.toString(),
      name: major.name,
      slug: major.slug,
      code: major.code ?? null,
    }));
  }

  async countActiveMajorsByFacultyId(facultyId: string): Promise<number> {
    return MajorModel.countDocuments({ facultyId, isActive: true });
  }
}
