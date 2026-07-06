import type { Response } from "express";
import type { FacultyService } from "../application/services/FacultyService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export function createFacultyController(facultyService: FacultyService) {
  return {
    listFaculties: asyncHandler(async (_req, res: Response) => {
      const faculties = await facultyService.listActiveFaculties();

      res.status(200).json({
        success: true,
        data: faculties,
      });
    }),

    listMajors: asyncHandler(async (req, res: Response) => {
      const facultyId = String(req.params.facultyId);
      const majors = await facultyService.getFacultyMajors(facultyId);

      res.status(200).json({
        success: true,
        data: majors,
      });
    }),

    getMajor: asyncHandler(async (req, res: Response) => {
      const major = await facultyService.getActiveMajor(String(req.params.majorId));

      res.status(200).json({
        success: true,
        data: major,
      });
    }),
  };
}
