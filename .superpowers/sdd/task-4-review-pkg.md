BASE 9ff29071ba4991acba53df388075b0db42269008
HEAD 63fab07edff242db01bdb0edebed3b863c2cfda0

63fab07 fix(reactions): validate DELETE emoji and harden reaction limit
0a05185 feat(reactions): toggle multi-emoji reactions via API
 .superpowers/sdd/task-4-report.md                  |  39 ++++++
 backend/scripts/seed-mock-data.ts                  |  14 +--
 .../src/application/services/ReactionService.ts    |  71 ++++++++---
 backend/src/controllers/reactionController.ts      |  19 ++-
 .../repositories/MongooseReactionRepository.ts     |  18 ++-
 backend/src/routes/reactionRoutes.ts               |   2 +-
 backend/src/validators/engagementSchemas.ts        |   5 +-
 backend/tests/integration/engagement.test.ts       |  13 +-
 backend/tests/unit/anonymityContract.test.ts       |   4 +-
 backend/tests/unit/commentMapper.test.ts           |   4 +-
 .../tests/unit/mongooseReactionRepository.test.ts  |  71 +++++++++++
 backend/tests/unit/moodMapper.test.ts              |   2 +-
 backend/tests/unit/reactionService.test.ts         | 132 +++++++++++++++++++++
 13 files changed, 354 insertions(+), 40 deletions(-)
diff --git a/.superpowers/sdd/task-4-report.md b/.superpowers/sdd/task-4-report.md
new file mode 100644
index 0000000..0391696
--- /dev/null
+++ b/.superpowers/sdd/task-4-report.md
@@ -0,0 +1,39 @@
+# Task 4 Report: Reaction service + API wiring
+
+## Status
+**DONE**
+
+## Commits
+- `0a05185` feat(reactions): toggle multi-emoji reactions via API
+
+## Changes
+- Added TDD unit coverage for emoji validation, the seven-reaction limit, toggle-off at the limit, emoji-specific removal, and caller-owned reaction views.
+- Replaced the legacy single-slug service flow with `toggleReaction`, emoji-keyed mutation results, `userReactions`, and exact `REACTION_LIMIT_REACHED` handling.
+- Updated the Zod request schemas, controller, and routes to accept and forward `emoji`.
+- Migrated integration and anonymity/mapper fixtures from legacy slug keys to emoji keys.
+- Updated the mock-data seed script to compile and persist `emoji`.
+
+## Test Summary
+- TDD red: `npm test -- tests/unit/reactionService.test.ts` failed 3/3 because `toggleReaction` did not exist; expanded view tests then failed 5/5 against the legacy service.
+- TDD green: reaction service tests pass, 5/5.
+- Focused reaction/integration/mapper tests pass, 17/17.
+- Full backend tests pass: 21 files passed, 4 skipped; 55 tests passed, 10 skipped.
+- `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check` pass.
+
+## Concerns
+- The service-level count check and repository toggle are separate operations, so simultaneous additions for one user/target can race past the limit without a transaction or atomic database constraint.
+- The legacy database unique index remains until the planned Task 5 migration.
+
+## Report Path
+`C:\Users\pd680\mood-of-the-major\.superpowers\sdd\task-4-report.md`
+
+## Review Fixes
+- `removeReaction` now trims and validates with `isValidReactionEmoji` before target lookup or repository mutation.
+- Repository toggle now checks the count after creating and incrementing the summary; an over-limit create deletes that exact document, reverses the summary increment, and throws `REACTION_LIMIT_REACHED`.
+- Added DELETE reaction authentication coverage and repository rollback coverage.
+
+## Review Fix Verification
+- TDD red: reaction service remove validation resolved instead of rejecting; repository over-limit toggle resolved instead of rolling back.
+- Required command: `npm test -- tests/unit/reactionService.test.ts tests/integration/engagement.test.ts` GÇö 2 files passed, 13 tests passed.
+- Repository rollback: `npm test -- tests/unit/mongooseReactionRepository.test.ts` GÇö 1 file passed, 1 test passed.
+- `npm run lint` and `npm run typecheck` passed.
diff --git a/backend/scripts/seed-mock-data.ts b/backend/scripts/seed-mock-data.ts
index bd9225c..c62ba98 100644
--- a/backend/scripts/seed-mock-data.ts
+++ b/backend/scripts/seed-mock-data.ts
@@ -2,11 +2,11 @@ import "dotenv/config";
 import { randomInt } from "node:crypto";
 import { loadEnv } from "../src/config/env.js";
 import { connectDatabase, disconnectDatabase } from "../src/infrastructure/database/connection.js";
 import { createLogger } from "../src/infrastructure/logging/logger.js";
 import { BcryptPasswordHasher } from "../src/infrastructure/auth/BcryptPasswordHasher.js";
-import { REACTION_TYPES } from "../src/domain/constants/engagementConstants.js";
+import { DEFAULT_REACTION_EMOJIS } from "../src/domain/constants/engagementConstants.js";
 import { FacultyModel } from "../src/infrastructure/database/models/Faculty.js";
 import { MajorModel } from "../src/infrastructure/database/models/Major.js";
 import { MoodModel } from "../src/infrastructure/database/models/Mood.js";
 import { MoodTagModel } from "../src/infrastructure/database/models/MoodTag.js";
 import { TagModel } from "../src/infrastructure/database/models/Tag.js";
@@ -216,21 +216,21 @@ async function seedMockData(): Promise<void> {
     for (const userId of reactionUsers) {
       if (userId.equals(authorId)) {
         continue;
       }
 
-      const reactionType = pickOne(REACTION_TYPES);
+      const emoji = pickOne(DEFAULT_REACTION_EMOJIS);
       try {
         await ReactionModel.create({
           userId,
           targetType: "mood",
           targetId: mood._id,
-          reactionType,
+          emoji,
           createdAt,
           updatedAt: createdAt,
         });
-        reactionSummary[reactionType] = (reactionSummary[reactionType] ?? 0) + 1;
+        reactionSummary[emoji] = (reactionSummary[emoji] ?? 0) + 1;
         reactionsCreated += 1;
       } catch {
         // duplicate reaction for same user/target GÇö skip
       }
     }
@@ -262,24 +262,24 @@ async function seedMockData(): Promise<void> {
         moodCommentCount += 1;
         commentsCreated += 1;
 
         if (randomInt(0, 100) < 35) {
           const commentReactor = pickOne(studentIds);
-          const reactionType = pickOne(REACTION_TYPES);
+          const emoji = pickOne(DEFAULT_REACTION_EMOJIS);
           try {
             await ReactionModel.create({
               userId: commentReactor,
               targetType: "comment",
               targetId: comment._id,
-              reactionType,
+              emoji,
               createdAt: commentAt,
               updatedAt: commentAt,
             });
             reactionsCreated += 1;
             await CommentModel.updateOne(
               { _id: comment._id },
-              { reactionSummary: { [reactionType]: 1 } },
+              { reactionSummary: { [emoji]: 1 } },
             );
           } catch {
             // skip duplicate
           }
         }
diff --git a/backend/src/application/services/ReactionService.ts b/backend/src/application/services/ReactionService.ts
index 75c78f6..ed5cc68 100644
--- a/backend/src/application/services/ReactionService.ts
+++ b/backend/src/application/services/ReactionService.ts
@@ -1,23 +1,24 @@
-import { REACTION_TYPES, type ReactionType } from "../../domain/constants/engagementConstants.js";
+import { MAX_REACTIONS_PER_USER } from "../../domain/constants/engagementConstants.js";
 import type { ReactionTargetType } from "../../domain/entities/Reaction.js";
-import { NotFoundError, ValidationError } from "../../domain/errors/AppError.js";
+import { AppError, NotFoundError, ValidationError } from "../../domain/errors/AppError.js";
 import type { ICommentRepository } from "../../domain/ports/ICommentRepository.js";
 import type { IMoodRepository } from "../../domain/ports/IMoodRepository.js";
 import type { IReactionRepository } from "../../domain/ports/IReactionRepository.js";
+import { isValidReactionEmoji } from "../../domain/utils/isValidReactionEmoji.js";
 
-export interface UpsertReactionServiceInput {
+export interface ToggleReactionServiceInput {
   targetType: ReactionTargetType;
   targetId: string;
-  reactionType: ReactionType;
+  emoji: string;
 }
 
 export interface ReactionView {
   targetType: ReactionTargetType;
   targetId: string;
   reactionSummary: Record<string, number>;
-  userReaction: ReactionType | null;
+  userReactions: string[];
 }
 
 export class ReactionService {
   constructor(
     private readonly reactions: IReactionRepository,
@@ -34,47 +35,79 @@ export class ReactionService {
 
     const comment = await this.comments.findById(targetId);
     if (!comment) throw new NotFoundError("Comment not found", "COMMENT_NOT_FOUND");
   }
 
-  async upsertReaction(userId: string, input: UpsertReactionServiceInput) {
-    if (!REACTION_TYPES.includes(input.reactionType)) {
-      throw new ValidationError("Invalid reaction type", [
-        { field: "reactionType", message: "Reaction type is not allowed." },
+  async toggleReaction(userId: string, input: ToggleReactionServiceInput) {
+    const emoji = input.emoji.trim();
+    if (!isValidReactionEmoji(emoji)) {
+      throw new ValidationError("Invalid reaction emoji", [
+        { field: "emoji", message: "Must be a single emoji." },
       ]);
     }
 
     await this.assertTargetExists(input.targetType, input.targetId);
 
-    const result = await this.reactions.upsert({
+    const existing = await this.reactions.findUserReactions(
+      userId,
+      input.targetType,
+      input.targetId,
+    );
+    if (!existing.includes(emoji)) {
+      const count = await this.reactions.countUserReactions(
+        userId,
+        input.targetType,
+        input.targetId,
+      );
+      if (count >= MAX_REACTIONS_PER_USER) {
+        throw new AppError("Reaction limit reached", {
+          statusCode: 422,
+          code: "REACTION_LIMIT_REACHED",
+        });
+      }
+    }
+
+    const result = await this.reactions.toggle({
       userId,
       targetType: input.targetType,
       targetId: input.targetId,
-      reactionType: input.reactionType,
+      emoji,
     });
 
     return {
       targetType: input.targetType,
       targetId: input.targetId,
-      reactionType: result.reactionType,
-      reactionSummary: result.reactionSummary,
+      ...result,
     };
   }
 
   async removeReaction(
     userId: string,
     targetType: ReactionTargetType,
     targetId: string,
+    emoji: string,
   ) {
+    const normalizedEmoji = emoji.trim();
+    if (!isValidReactionEmoji(normalizedEmoji)) {
+      throw new ValidationError("Invalid reaction emoji", [
+        { field: "emoji", message: "Must be a single emoji." },
+      ]);
+    }
+
     await this.assertTargetExists(targetType, targetId);
 
-    const result = await this.reactions.remove({ userId, targetType, targetId });
+    const result = await this.reactions.remove({
+      userId,
+      targetType,
+      targetId,
+      emoji: normalizedEmoji,
+    });
 
     return {
       targetType,
       targetId,
-      reactionSummary: result.reactionSummary,
+      ...result,
     };
   }
 
   async getReactions(
     targetType: ReactionTargetType,
@@ -82,12 +115,12 @@ export class ReactionService {
     userId?: string,
   ): Promise<ReactionView> {
     await this.assertTargetExists(targetType, targetId);
 
     const reactionSummary = await this.reactions.getReactionSummary(targetType, targetId);
-    const userReaction = userId
-      ? await this.reactions.findUserReaction(userId, targetType, targetId)
-      : null;
+    const userReactions = userId
+      ? await this.reactions.findUserReactions(userId, targetType, targetId)
+      : [];
 
-    return { targetType, targetId, reactionSummary, userReaction };
+    return { targetType, targetId, reactionSummary, userReactions };
   }
 }
diff --git a/backend/src/controllers/reactionController.ts b/backend/src/controllers/reactionController.ts
index f4a36a1..36ccb69 100644
--- a/backend/src/controllers/reactionController.ts
+++ b/backend/src/controllers/reactionController.ts
@@ -1,32 +1,43 @@
 import type { Response } from "express";
-import type { ReactionService, UpsertReactionServiceInput } from "../application/services/ReactionService.js";
+import type {
+  ReactionService,
+  ToggleReactionServiceInput,
+} from "../application/services/ReactionService.js";
 import { asyncHandler } from "../utils/asyncHandler.js";
 import { AuthenticationError } from "../domain/errors/AppError.js";
 
 export function createReactionController(reactionService: ReactionService) {
   return {
-    upsert: asyncHandler(async (req, res: Response) => {
+    toggle: asyncHandler(async (req, res: Response) => {
       if (!req.userId) {
         throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
       }
 
-      const result = await reactionService.upsertReaction(req.userId, req.body as UpsertReactionServiceInput);
+      const result = await reactionService.toggleReaction(
+        req.userId,
+        req.body as ToggleReactionServiceInput,
+      );
 
       res.status(200).json({ success: true, data: result });
     }),
 
     remove: asyncHandler(async (req, res: Response) => {
       if (!req.userId) {
         throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
       }
 
-      const body = req.body as { targetType: "mood" | "comment"; targetId: string };
+      const body = req.body as {
+        targetType: "mood" | "comment";
+        targetId: string;
+        emoji: string;
+      };
       const result = await reactionService.removeReaction(
         req.userId,
         body.targetType,
         body.targetId,
+        body.emoji,
       );
 
       res.status(200).json({ success: true, data: result });
     }),
 
diff --git a/backend/src/infrastructure/database/repositories/MongooseReactionRepository.ts b/backend/src/infrastructure/database/repositories/MongooseReactionRepository.ts
index 55763b1..4f208a7 100644
--- a/backend/src/infrastructure/database/repositories/MongooseReactionRepository.ts
+++ b/backend/src/infrastructure/database/repositories/MongooseReactionRepository.ts
@@ -2,10 +2,12 @@ import type {
   ReactionMutationResult,
   RemoveReactionInput,
   ReactionTargetType,
   ToggleReactionInput,
 } from "../../../domain/entities/Reaction.js";
+import { MAX_REACTIONS_PER_USER } from "../../../domain/constants/engagementConstants.js";
+import { AppError } from "../../../domain/errors/AppError.js";
 import type { IReactionRepository } from "../../../domain/ports/IReactionRepository.js";
 import { CommentModel } from "../models/Comment.js";
 import { MoodModel } from "../models/Mood.js";
 import { ReactionModel } from "../models/Reaction.js";
 
@@ -77,11 +79,11 @@ export class MongooseReactionRepository implements IReactionRepository {
         reactionSummary,
         userReactions,
       };
     }
 
-    await ReactionModel.create({
+    const created = await ReactionModel.create({
       userId: input.userId,
       targetType: input.targetType,
       targetId: input.targetId,
       emoji: input.emoji,
     });
@@ -90,10 +92,24 @@ export class MongooseReactionRepository implements IReactionRepository {
       input.targetType,
       input.targetId,
       input.emoji,
       1,
     );
+    const count = await this.countUserReactions(
+      input.userId,
+      input.targetType,
+      input.targetId,
+    );
+    if (count > MAX_REACTIONS_PER_USER) {
+      await created.deleteOne();
+      await adjustTargetSummary(input.targetType, input.targetId, input.emoji, -1);
+      throw new AppError("Reaction limit reached", {
+        statusCode: 422,
+        code: "REACTION_LIMIT_REACHED",
+      });
+    }
+
     const userReactions = await this.findUserReactions(
       input.userId,
       input.targetType,
       input.targetId,
     );
diff --git a/backend/src/routes/reactionRoutes.ts b/backend/src/routes/reactionRoutes.ts
index 96628a7..3b34512 100644
--- a/backend/src/routes/reactionRoutes.ts
+++ b/backend/src/routes/reactionRoutes.ts
@@ -15,11 +15,11 @@ export function createReactionRoutes(deps: Dependencies): Router {
   router.put(
     "/",
     authenticate,
     authorize("student", "administrator"),
     validate(upsertReactionSchema),
-    reactionController.upsert,
+    reactionController.toggle,
   );
 
   router.delete(
     "/",
     authenticate,
diff --git a/backend/src/validators/engagementSchemas.ts b/backend/src/validators/engagementSchemas.ts
index 8a7e051..2987272 100644
--- a/backend/src/validators/engagementSchemas.ts
+++ b/backend/src/validators/engagementSchemas.ts
@@ -1,10 +1,10 @@
 import { z } from "zod";
 import {
   COMMENT_CONTENT_MAX_LENGTH,
   COMMENT_CONTENT_MIN_LENGTH,
-  REACTION_TYPES,
+  EMOJI_MAX_LENGTH,
   REPORT_DESCRIPTION_MAX_LENGTH,
   REPORT_REASON_CODES,
   SEARCH_QUERY_MIN_LENGTH,
 } from "../domain/constants/engagementConstants.js";
 
@@ -28,16 +28,17 @@ export const moodIdParamSchema = z.object({
 });
 
 export const upsertReactionSchema = z.object({
   targetType: z.enum(["mood", "comment"]),
   targetId: z.string().min(1),
-  reactionType: z.enum(REACTION_TYPES),
+  emoji: z.string().trim().min(1).max(EMOJI_MAX_LENGTH),
 });
 
 export const removeReactionSchema = z.object({
   targetType: z.enum(["mood", "comment"]),
   targetId: z.string().min(1),
+  emoji: z.string().trim().min(1).max(EMOJI_MAX_LENGTH),
 });
 
 export const reactionQuerySchema = z.object({
   targetType: z.enum(["mood", "comment"]),
   targetId: z.string().min(1),
diff --git a/backend/tests/integration/engagement.test.ts b/backend/tests/integration/engagement.test.ts
index a6e0b54..c8bf77b 100644
--- a/backend/tests/integration/engagement.test.ts
+++ b/backend/tests/integration/engagement.test.ts
@@ -48,11 +48,22 @@ describe("Engagement routes", () => {
 
   it("PUT /api/v1/reactions requires authentication", async () => {
     const response = await request(app).put("/api/v1/reactions").send({
       targetType: "mood",
       targetId: "665a1b2c3d4e5f6789012348",
-      reactionType: "empathy",
+      emoji: "=ƒÆÖ",
+    });
+
+    expect(response.status).toBe(401);
+    expect(response.body.error.code).toBe("AUTH_REQUIRED");
+  });
+
+  it("DELETE /api/v1/reactions requires authentication", async () => {
+    const response = await request(app).delete("/api/v1/reactions").send({
+      targetType: "mood",
+      targetId: "665a1b2c3d4e5f6789012348",
+      emoji: "=ƒÆÖ",
     });
 
     expect(response.status).toBe(401);
     expect(response.body.error.code).toBe("AUTH_REQUIRED");
   });
diff --git a/backend/tests/unit/anonymityContract.test.ts b/backend/tests/unit/anonymityContract.test.ts
index 061ddca..9920c4f 100644
--- a/backend/tests/unit/anonymityContract.test.ts
+++ b/backend/tests/unit/anonymityContract.test.ts
@@ -26,11 +26,11 @@ const sampleMood: MoodWithRelations = {
   content: "Feeling overwhelmed with finals week...",
   facultyId: "665a1b2c3d4e5f6789012345",
   majorId: "665a1b2c3d4e5f6789012346",
   status: "active",
   commentCount: 5,
-  reactionSummary: { empathy: 12, support: 8 },
+  reactionSummary: { "=ƒÆÖ": 12, "=ƒñ¥": 8 },
   imageCount: 1,
   primaryTagId: "665a1b2c3d4e5f6789012349",
   reportCount: 0,
   lastActivityAt: new Date("2026-07-05T10:30:00.000Z"),
   editedAt: null,
@@ -55,11 +55,11 @@ const sampleComment: Comment = {
   authorId: "665a1b2c3d4e5f6789012340",
   parentId: null,
   content: "You are not alone.",
   depth: 0,
   status: "active",
-  reactionSummary: { empathy: 2 },
+  reactionSummary: { "=ƒÆÖ": 2 },
   createdAt: new Date("2026-07-05T09:00:00.000Z"),
   updatedAt: new Date("2026-07-05T09:00:00.000Z"),
   deletedAt: null,
 };
 
diff --git a/backend/tests/unit/commentMapper.test.ts b/backend/tests/unit/commentMapper.test.ts
index f13a814..2f51845 100644
--- a/backend/tests/unit/commentMapper.test.ts
+++ b/backend/tests/unit/commentMapper.test.ts
@@ -10,11 +10,11 @@ const sampleComment: Comment = {
   moodId: "665a1b2c3d4e5f6789012348",
   authorId: "665a1b2c3d4e5f6789012301",
   parentId: null,
   content: "You're not alone in this.",
   status: "active",
-  reactionSummary: { support: 3 },
+  reactionSummary: { "=ƒñ¥": 3 },
   depth: 0,
   createdAt: new Date("2026-07-05T09:00:00.000Z"),
   updatedAt: new Date("2026-07-05T09:00:00.000Z"),
   deletedAt: null,
 };
@@ -26,11 +26,11 @@ describe("commentMapper", () => {
     expect(dto).toEqual({
       id: sampleComment.id,
       content: sampleComment.content,
       parentId: null,
       depth: 0,
-      reactionSummary: { support: 3 },
+      reactionSummary: { "=ƒñ¥": 3 },
       createdAt: "2026-07-05T09:00:00.000Z",
     });
 
     expect(JSON.stringify(dto)).not.toContain("authorId");
     assertNoCommentIdentityFields(dto);
diff --git a/backend/tests/unit/mongooseReactionRepository.test.ts b/backend/tests/unit/mongooseReactionRepository.test.ts
new file mode 100644
index 0000000..1c50479
--- /dev/null
+++ b/backend/tests/unit/mongooseReactionRepository.test.ts
@@ -0,0 +1,71 @@
+import { beforeEach, describe, expect, it, vi } from "vitest";
+
+const modelMocks = vi.hoisted(() => ({
+  reaction: {
+    findOne: vi.fn(),
+    create: vi.fn(),
+    countDocuments: vi.fn(),
+    find: vi.fn(),
+  },
+  mood: {
+    findOneAndUpdate: vi.fn(),
+  },
+  comment: {
+    findOneAndUpdate: vi.fn(),
+  },
+}));
+
+vi.mock("../../src/infrastructure/database/models/Reaction.js", () => ({
+  ReactionModel: modelMocks.reaction,
+}));
+vi.mock("../../src/infrastructure/database/models/Mood.js", () => ({
+  MoodModel: modelMocks.mood,
+}));
+vi.mock("../../src/infrastructure/database/models/Comment.js", () => ({
+  CommentModel: modelMocks.comment,
+}));
+
+import { MongooseReactionRepository } from "../../src/infrastructure/database/repositories/MongooseReactionRepository.js";
+
+describe("MongooseReactionRepository.toggle", () => {
+  beforeEach(() => {
+    vi.clearAllMocks();
+  });
+
+  it("rolls back a created reaction and summary when the user exceeds the limit", async () => {
+    const created = { deleteOne: vi.fn().mockResolvedValue(undefined) };
+    modelMocks.reaction.findOne.mockResolvedValue(null);
+    modelMocks.reaction.create.mockResolvedValue(created);
+    modelMocks.reaction.countDocuments.mockResolvedValue(8);
+    modelMocks.reaction.find.mockReturnValue({
+      select: vi.fn().mockReturnValue({
+        lean: vi.fn().mockResolvedValue([{ emoji: "=ƒÄë" }]),
+      }),
+    });
+    modelMocks.mood.findOneAndUpdate
+      .mockReturnValueOnce({
+        lean: vi.fn().mockResolvedValue({ reactionSummary: { "=ƒÄë": 1 } }),
+      })
+      .mockReturnValueOnce({
+        lean: vi.fn().mockResolvedValue({ reactionSummary: { "=ƒÄë": 0 } }),
+      });
+
+    const repository = new MongooseReactionRepository();
+
+    await expect(
+      repository.toggle({
+        userId: "u1",
+        targetType: "mood",
+        targetId: "m1",
+        emoji: "=ƒÄë",
+      }),
+    ).rejects.toMatchObject({ code: "REACTION_LIMIT_REACHED" });
+    expect(created.deleteOne).toHaveBeenCalledOnce();
+    expect(modelMocks.mood.findOneAndUpdate).toHaveBeenNthCalledWith(
+      2,
+      { _id: "m1" },
+      expect.objectContaining({ $inc: { "reactionSummary.=ƒÄë": -1 } }),
+      { new: true },
+    );
+  });
+});
diff --git a/backend/tests/unit/moodMapper.test.ts b/backend/tests/unit/moodMapper.test.ts
index a729969..2748288 100644
--- a/backend/tests/unit/moodMapper.test.ts
+++ b/backend/tests/unit/moodMapper.test.ts
@@ -8,11 +8,11 @@ const sampleMood: MoodWithRelations = {
   content: "Feeling overwhelmed with finals week...",
   facultyId: "665a1b2c3d4e5f6789012345",
   majorId: "665a1b2c3d4e5f6789012346",
   status: "active",
   commentCount: 5,
-  reactionSummary: { empathy: 12, support: 8 },
+  reactionSummary: { "=ƒÆÖ": 12, "=ƒñ¥": 8 },
   imageCount: 1,
   primaryTagId: "665a1b2c3d4e5f6789012349",
   reportCount: 0,
   lastActivityAt: new Date("2026-07-05T10:30:00.000Z"),
   editedAt: null,
diff --git a/backend/tests/unit/reactionService.test.ts b/backend/tests/unit/reactionService.test.ts
new file mode 100644
index 0000000..f09f53c
--- /dev/null
+++ b/backend/tests/unit/reactionService.test.ts
@@ -0,0 +1,132 @@
+import { describe, expect, it, vi } from "vitest";
+import { ReactionService } from "../../src/application/services/ReactionService.js";
+
+function makeService(
+  overrides: Partial<{
+    toggle: ReturnType<typeof vi.fn>;
+    remove: ReturnType<typeof vi.fn>;
+    countUserReactions: ReturnType<typeof vi.fn>;
+    findUserReactions: ReturnType<typeof vi.fn>;
+    getReactionSummary: ReturnType<typeof vi.fn>;
+  }> = {},
+) {
+  const reactions = {
+    toggle: vi.fn(),
+    remove: vi.fn(),
+    findUserReactions: vi.fn().mockResolvedValue([]),
+    countUserReactions: vi.fn().mockResolvedValue(0),
+    getReactionSummary: vi.fn().mockResolvedValue({}),
+    ...overrides,
+  };
+  const moods = { isActive: vi.fn().mockResolvedValue(true) };
+  const comments = { findById: vi.fn() };
+
+  return {
+    service: new ReactionService(reactions as never, moods as never, comments as never),
+    reactions,
+  };
+}
+
+describe("ReactionService.toggleReaction", () => {
+  it("rejects invalid emoji", async () => {
+    const { service } = makeService();
+
+    await expect(
+      service.toggleReaction("u1", {
+        targetType: "mood",
+        targetId: "m1",
+        emoji: "empathy",
+      }),
+    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
+  });
+
+  it("rejects when adding beyond 7 and emoji not already owned", async () => {
+    const { service, reactions } = makeService({
+      countUserReactions: vi.fn().mockResolvedValue(7),
+      findUserReactions: vi.fn().mockResolvedValue(["=ƒÆÖ", "=ƒñ¥", "=ƒ½é", "G£è", "=ƒöÑ", "G£¿", "=ƒÿé"]),
+    });
+
+    await expect(
+      service.toggleReaction("u1", {
+        targetType: "mood",
+        targetId: "m1",
+        emoji: "=ƒÄë",
+      }),
+    ).rejects.toMatchObject({ code: "REACTION_LIMIT_REACHED" });
+    expect(reactions.toggle).not.toHaveBeenCalled();
+  });
+
+  it("allows toggle-off when already at 7", async () => {
+    const owned = ["=ƒÆÖ", "=ƒñ¥", "=ƒ½é", "G£è", "=ƒöÑ", "G£¿", "=ƒÿé"];
+    const { service, reactions } = makeService({
+      countUserReactions: vi.fn().mockResolvedValue(7),
+      findUserReactions: vi.fn().mockResolvedValue(owned),
+      toggle: vi.fn().mockResolvedValue({
+        emoji: "=ƒöÑ",
+        toggledOn: false,
+        reactionSummary: {},
+        userReactions: owned.filter((emoji) => emoji !== "=ƒöÑ"),
+      }),
+    });
+
+    const result = await service.toggleReaction("u1", {
+      targetType: "mood",
+      targetId: "m1",
+      emoji: "=ƒöÑ",
+    });
+
+    expect(result.toggledOn).toBe(false);
+    expect(reactions.toggle).toHaveBeenCalled();
+  });
+});
+
+describe("ReactionService reaction views", () => {
+  it("rejects invalid emoji when removing a reaction", async () => {
+    const { service, reactions } = makeService();
+
+    await expect(
+      service.removeReaction("u1", "mood", "m1", " empathy "),
+    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
+    expect(reactions.remove).not.toHaveBeenCalled();
+  });
+
+  it("removes one emoji and returns the repository mutation view", async () => {
+    const remove = vi.fn().mockResolvedValue({
+      emoji: "=ƒÆÖ",
+      toggledOn: false,
+      reactionSummary: { "=ƒñ¥": 1 },
+      userReactions: ["=ƒñ¥"],
+    });
+    const { service } = makeService({ remove });
+
+    const result = await service.removeReaction("u1", "mood", "m1", " =ƒÆÖ ");
+
+    expect(remove).toHaveBeenCalledWith({
+      userId: "u1",
+      targetType: "mood",
+      targetId: "m1",
+      emoji: "=ƒÆÖ",
+    });
+    expect(result).toMatchObject({
+      targetType: "mood",
+      targetId: "m1",
+      emoji: "=ƒÆÖ",
+      toggledOn: false,
+      userReactions: ["=ƒñ¥"],
+    });
+  });
+
+  it("returns all reactions owned by the requesting user", async () => {
+    const { service } = makeService({
+      getReactionSummary: vi.fn().mockResolvedValue({ "=ƒÆÖ": 2 }),
+      findUserReactions: vi.fn().mockResolvedValue(["=ƒÆÖ"]),
+    });
+
+    await expect(service.getReactions("mood", "m1", "u1")).resolves.toEqual({
+      targetType: "mood",
+      targetId: "m1",
+      reactionSummary: { "=ƒÆÖ": 2 },
+      userReactions: ["=ƒÆÖ"],
+    });
+  });
+});
