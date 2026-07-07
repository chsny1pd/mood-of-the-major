export interface FacultySummary {
  id: string;
  name: string;
  nameTh: string | null;
  slug: string;
  code: string | null;
  majorCount: number;
}

export interface MajorSummary {
  id: string;
  name: string;
  nameTh: string | null;
  slug: string;
  code: string | null;
}

export interface MajorWithFaculty extends MajorSummary {
  facultyId: string;
}

export interface IFacultyRepository {
  findAllActive(): Promise<FacultySummary[]>;
  findActiveById(id: string): Promise<{ id: string; name: string; nameTh: string | null; slug: string } | null>;
  findActiveMajorById(
    majorId: string,
    facultyId: string,
  ): Promise<MajorSummary | null>;
  findActiveMajorByIdOnly(majorId: string): Promise<MajorWithFaculty | null>;
  findActiveMajorsByFacultyId(facultyId: string): Promise<MajorSummary[]>;
  countActiveMajorsByFacultyId(facultyId: string): Promise<number>;
}
