import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

export const statisticsScopeQuerySchema = z
  .object({
    scope: z.enum(["platform", "faculty", "major"]).default("platform"),
    scopeId: objectIdSchema.optional(),
    period: z.enum(["7d", "30d", "90d"]).default("30d"),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.scope !== "platform" && !value.scopeId) {
      ctx.addIssue({
        code: "custom",
        message: "scopeId is required when scope is faculty or major.",
        path: ["scopeId"],
      });
    }
  });

export const trendingQuerySchema = z
  .object({
    scope: z.enum(["platform", "faculty", "major"]).default("platform"),
    scopeId: objectIdSchema.optional(),
    window: z.enum(["7d", "30d"]).default("7d"),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.scope !== "platform" && !value.scopeId) {
      ctx.addIssue({
        code: "custom",
        message: "scopeId is required when scope is faculty or major.",
        path: ["scopeId"],
      });
    }
  });
