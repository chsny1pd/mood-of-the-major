import type { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";

export const adminController = {
  overview: asyncHandler(async (_req, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        message: "Admin namespace is protected. Full dashboard ships in Sprint 6.",
      },
    });
  }),
};
