import type { IFacultyRepository } from "../../domain/ports/IFacultyRepository.js";
import { AppError } from "../../domain/errors/AppError.js";

export class FacultyService {
  constructor(private readonly faculties: IFacultyRepository) {}

  listActiveFaculties() {
    return this.faculties.findAllActive();
  }

  getFacultyMajors(facultyId: string) {
    return this.faculties.findActiveMajorsByFacultyId(facultyId);
  }

  async getActiveMajor(majorIdOrSlug: string) {
    const major = await this.faculties.findActiveMajorByIdOnly(majorIdOrSlug);

    if (!major) {
      throw new AppError("Major not found", { statusCode: 404, code: "NOT_FOUND" });
    }

    const faculty = await this.faculties.findActiveById(major.facultyId);

    return {
      id: major.id,
      name: major.name,
      slug: major.slug,
      code: major.code,
      faculty: faculty
        ? { id: faculty.id, name: faculty.name, nameTh: faculty.nameTh, slug: faculty.slug }
        : null,
    };
  }
}
