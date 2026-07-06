import type { IFacultyRepository } from "../../domain/ports/IFacultyRepository.js";

export class FacultyService {
  constructor(private readonly faculties: IFacultyRepository) {}

  listActiveFaculties() {
    return this.faculties.findAllActive();
  }

  getFacultyMajors(facultyId: string) {
    return this.faculties.findActiveMajorsByFacultyId(facultyId);
  }
}
