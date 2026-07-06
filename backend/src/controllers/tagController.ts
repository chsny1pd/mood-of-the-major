import type { Response } from "express";
import type { ITagRepository } from "../domain/ports/ITagRepository.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export function createTagController(tags: ITagRepository) {
  return {
    listEmotions: asyncHandler(async (_req, res: Response) => {
      const data = await tags.findAllActiveEmotions();

      res.status(200).json({
        success: true,
        data: data.map((tag) => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          colorToken: tag.colorToken,
          iconKey: tag.iconKey,
        })),
      });
    }),
  };
}
