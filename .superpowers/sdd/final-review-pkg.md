BASE d28f04696d4649af6d78362f669e7eff841ae411
HEAD 36a733d31addb8050d5f2e606845c156796196bb

36a733d fix(reactions): remove legacy slug naming
bdd7acf docs: document multi-emoji reaction contract
68e376f fix(reactions): harden reaction picker validation and close behavior
9677aca feat(reactions): chat-style multi-emoji reaction bar
42fd9d6 feat(reactions): update frontend types and API client for emoji reactions
8494041 chore(reactions): add migration from slug reactions to emoji
63fab07 fix(reactions): validate DELETE emoji and harden reaction limit
0a05185 feat(reactions): toggle multi-emoji reactions via API
9ff2907 feat(reactions): persist multi-emoji reactions in mongoose
008c902 refactor(reactions): switch domain types from slug to emoji
26fa365 feat(reactions): add emoji validation and default reaction constants

## Stat

 .superpowers/sdd/task-4-report.md                  |  39 ++++++
 .superpowers/sdd/task-7-report.md                  |  37 +++++
 backend/package.json                               |   1 +
 backend/scripts/migrate-reaction-emojis.ts         | 131 ++++++++++++++++++
 backend/scripts/seed-mock-data.ts                  |  14 +-
 .../src/application/services/ReactionService.ts    |  71 +++++++---
 backend/src/controllers/reactionController.ts      |  19 ++-
 .../src/domain/constants/engagementConstants.ts    |  14 +-
 backend/src/domain/entities/Reaction.ts            |  16 ++-
 backend/src/domain/ports/ICommentRepository.ts     |   2 +-
 backend/src/domain/ports/IMoodRepository.ts        |   2 +-
 backend/src/domain/ports/IReactionRepository.ts    |  22 +--
 backend/src/domain/utils/isValidReactionEmoji.ts   |  10 ++
 .../src/infrastructure/database/models/Reaction.ts |   9 +-
 .../repositories/MongooseCommentRepository.ts      |   4 +-
 .../repositories/MongooseMoodRepository.ts         |   4 +-
 .../repositories/MongooseReactionRepository.ts     | 125 ++++++++++++-----
 backend/src/routes/reactionRoutes.ts               |   2 +-
 backend/src/validators/engagementSchemas.ts        |   5 +-
 backend/tests/integration/engagement.test.ts       |  13 +-
 backend/tests/unit/anonymityContract.test.ts       |   4 +-
 backend/tests/unit/commentMapper.test.ts           |   4 +-
 backend/tests/unit/isValidReactionEmoji.test.ts    |  19 +++
 .../tests/unit/mongooseReactionRepository.test.ts  |  71 ++++++++++
 backend/tests/unit/moodMapper.test.ts              |   2 +-
 backend/tests/unit/reactionService.test.ts         | 132 ++++++++++++++++++
 docs/api.md                                        |  68 +++++++---
 docs/database.md                                   |  36 ++---
 docs/glossary.md                                   |   8 +-
 docs/requirements.md                               |   2 +-
 frontend/src/components/EmojiPicker.tsx            |   4 +-
 frontend/src/components/MoodCard.tsx               |   5 +-
 .../reactions/components/ReactionBar.test.tsx      | 136 +++++++++++++++++++
 .../features/reactions/components/ReactionBar.tsx  |  98 +++++++++-----
 .../reactions/components/ReactionEmojiPicker.tsx   | 150 +++++++++++++++++++++
 frontend/src/locales/en/translation.json           |   4 +
 frontend/src/locales/th/translation.json           |   4 +
 frontend/src/services/reactionService.ts           |  53 ++++----
 frontend/src/types/engagement.ts                   |  18 +--
 39 files changed, 1139 insertions(+), 219 deletions(-)

## Diff

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
diff --git a/.superpowers/sdd/task-7-report.md b/.superpowers/sdd/task-7-report.md
new file mode 100644
index 0000000..b0f043c
--- /dev/null
+++ b/.superpowers/sdd/task-7-report.md
@@ -0,0 +1,37 @@
+# Task 7 Report: ReactionBar UI (multi + picker)
+
+## Status
+**DONE**
+
+## Commits
+- `9677aca` feat(reactions): chat-style multi-emoji reaction bar
+
+## Changes
+- ReactionBar always renders the four default shortcuts, followed by non-default summary emojis with positive counts.
+- Added optimistic multi-reaction toggling with owned-chip highlighting, rollback, and a seven-reaction UI guard.
+- Added a compact picker containing the defaults, `EMOTION_EMOJI_OPTIONS`, and an eight-code-unit custom input.
+- Added authenticated limit messaging, disabled unauthenticated controls with the existing login link, dark-theme styles, and English/Thai i18n strings.
+- Fixed the shared `EmojiPicker` imports to resolve `src/lib` correctly.
+
+## Verification
+- `npm run typecheck` GÇö pass.
+- `npm test` GÇö pass (7 files, 10 tests).
+- ESLint on modified components GÇö pass.
+- Prettier check on all modified files GÇö pass.
+
+## Concerns
+- Browser smoke testing of feed/detail interactions and picker positioning was not available in this subtask environment.
+- Custom input relies on the server's emoji-grapheme validation, consistent with the API contract.
+
+## Report Path
+`C:\Users\pd680\mood-of-the-major\.superpowers\sdd\task-7-report.md`
+
+## Quality Findings Follow-up
+- Mirrored backend custom-reaction validation in the picker: trim, eight-code-unit maximum, ASCII-only rejection, and one-grapheme enforcement. Invalid input keeps the picker open with localized inline feedback.
+- Added localized mutation-error feedback instead of silently rolling back failed reaction updates.
+- Added Escape and outside-click dismissal with focus restoration to the add-reaction button.
+- Added `ReactionBar.test.tsx` coverage for default chips, owned active state, reaction-limit disabling, invalid custom input, both dismissal paths, focus restoration, and mutation errors.
+- `npm run typecheck` GÇö pass.
+- `npm test -- src/features/reactions/components/ReactionBar.test.tsx` GÇö pass (1 file, 7 tests).
+- ESLint on changed reaction components/test GÇö pass.
+- Prettier check on changed files GÇö pass after formatting.
diff --git a/backend/package.json b/backend/package.json
index bd2386b..cba5507 100644
--- a/backend/package.json
+++ b/backend/package.json
@@ -17,6 +17,7 @@
     "test:watch": "vitest",
     "seed": "tsx scripts/seed.ts",
     "backfill:approval-status": "tsx scripts/backfill-approval-status.ts",
+    "migrate:reaction-emojis": "tsx scripts/migrate-reaction-emojis.ts",
     "seed:e2e-admin": "tsx scripts/seed-e2e-admin.ts",
     "seed:sample-moods": "tsx scripts/seed-sample-moods.ts",
     "seed:mock-data": "tsx scripts/seed-mock-data.ts",
diff --git a/backend/scripts/migrate-reaction-emojis.ts b/backend/scripts/migrate-reaction-emojis.ts
new file mode 100644
index 0000000..e667dba
--- /dev/null
+++ b/backend/scripts/migrate-reaction-emojis.ts
@@ -0,0 +1,131 @@
+import "dotenv/config";
+import type { Model } from "mongoose";
+import { LEGACY_REACTION_SLUG_TO_EMOJI } from "../src/domain/constants/engagementConstants.js";
+import { loadEnv } from "../src/config/env.js";
+import { connectDatabase, disconnectDatabase } from "../src/infrastructure/database/connection.js";
+import { CommentModel } from "../src/infrastructure/database/models/Comment.js";
+import { MoodModel } from "../src/infrastructure/database/models/Mood.js";
+import { ReactionModel } from "../src/infrastructure/database/models/Reaction.js";
+import { createLogger } from "../src/infrastructure/logging/logger.js";
+
+const LEGACY_SLUGS = Object.keys(LEGACY_REACTION_SLUG_TO_EMOJI);
+const LEGACY_SUMMARY_QUERY = {
+  $or: LEGACY_SLUGS.map((slug) => ({
+    [`reactionSummary.${slug}`]: { $exists: true },
+  })),
+};
+const OLD_REACTION_INDEX = "userId_1_targetType_1_targetId_1";
+const EMOJI_UNIQUE_INDEX = "userId_1_targetType_1_targetId_1_emoji_1";
+
+function remapSummary(summary: Record<string, number>): Record<string, number> {
+  const next: Record<string, number> = {};
+  for (const [key, count] of Object.entries(summary ?? {})) {
+    const emoji =
+      LEGACY_REACTION_SLUG_TO_EMOJI[key as keyof typeof LEGACY_REACTION_SLUG_TO_EMOJI] ?? key;
+    next[emoji] = (next[emoji] ?? 0) + count;
+  }
+  return next;
+}
+
+async function migrateReactionDocuments(logger: ReturnType<typeof createLogger>): Promise<{
+  updated: number;
+  skipped: number;
+}> {
+  let updated = 0;
+  let skipped = 0;
+
+  const cursor = ReactionModel.find({
+    reactionType: { $exists: true },
+    emoji: { $exists: false },
+  }).cursor();
+
+  for await (const reaction of cursor) {
+    const slug = String(reaction.get("reactionType"));
+    const emoji =
+      LEGACY_REACTION_SLUG_TO_EMOJI[slug as keyof typeof LEGACY_REACTION_SLUG_TO_EMOJI];
+
+    if (!emoji) {
+      logger.warn("Unknown reaction slug, skipping reaction document", {
+        reactionId: reaction._id.toString(),
+        slug,
+      });
+      skipped += 1;
+      continue;
+    }
+
+    await ReactionModel.updateOne(
+      { _id: reaction._id },
+      { $set: { emoji }, $unset: { reactionType: "" } },
+    );
+    updated += 1;
+  }
+
+  return { updated, skipped };
+}
+
+async function migrateSummaries(
+  model: Model<{ reactionSummary?: Record<string, number> }>,
+): Promise<number> {
+  let updated = 0;
+  const cursor = model.find(LEGACY_SUMMARY_QUERY).select("reactionSummary").cursor();
+
+  for await (const doc of cursor) {
+    const summary = (doc.reactionSummary ?? {}) as Record<string, number>;
+    await model.updateOne({ _id: doc._id }, { $set: { reactionSummary: remapSummary(summary) } });
+    updated += 1;
+  }
+
+  return updated;
+}
+
+async function swapReactionIndexes(logger: ReturnType<typeof createLogger>): Promise<void> {
+  const indexes = await ReactionModel.collection.indexes();
+  const hasOldIndex = indexes.some((index) => index.name === OLD_REACTION_INDEX);
+
+  if (hasOldIndex) {
+    await ReactionModel.collection.dropIndex(OLD_REACTION_INDEX);
+    logger.info("Dropped legacy reaction index", { name: OLD_REACTION_INDEX });
+  }
+
+  await ReactionModel.syncIndexes();
+
+  const syncedIndexes = await ReactionModel.collection.indexes();
+  const hasEmojiUniqueIndex = syncedIndexes.some(
+    (index) => index.name === EMOJI_UNIQUE_INDEX && index.unique === true,
+  );
+
+  if (!hasEmojiUniqueIndex) {
+    throw new Error(`Failed to ensure unique index ${EMOJI_UNIQUE_INDEX}`);
+  }
+
+  logger.info("Reaction indexes synced", { ensured: EMOJI_UNIQUE_INDEX });
+}
+
+async function migrateReactionEmojis(): Promise<void> {
+  const env = loadEnv();
+  const logger = createLogger(env.LOG_LEVEL);
+
+  await connectDatabase(env.MONGODB_URI, logger);
+
+  const [reactions, moodsUpdated, commentsUpdated] = await Promise.all([
+    migrateReactionDocuments(logger),
+    migrateSummaries(MoodModel),
+    migrateSummaries(CommentModel),
+  ]);
+
+  await swapReactionIndexes(logger);
+
+  logger.info("Reaction emoji migration completed", {
+    reactionsUpdated: reactions.updated,
+    reactionsSkipped: reactions.skipped,
+    moodsUpdated,
+    commentsUpdated,
+  });
+
+  await disconnectDatabase();
+}
+
+migrateReactionEmojis().catch((error) => {
+  console.error("Reaction emoji migration failed:", error);
+  process.exit(1);
+});
diff --git a/backend/scripts/seed-mock-data.ts b/backend/scripts/seed-mock-data.ts
index bd9225c..c62ba98 100644
--- a/backend/scripts/seed-mock-data.ts
+++ b/backend/scripts/seed-mock-data.ts
@@ -4,7 +4,7 @@ import { loadEnv } from "../src/config/env.js";
 import { connectDatabase, disconnectDatabase } from "../src/infrastructure/database/connection.js";
 import { createLogger } from "../src/infrastructure/logging/logger.js";
 import { BcryptPasswordHasher } from "../src/infrastructure/auth/BcryptPasswordHasher.js";
-import { REACTION_TYPES } from "../src/domain/constants/engagementConstants.js";
+import { DEFAULT_REACTION_EMOJIS } from "../src/domain/constants/engagementConstants.js";
 import { FacultyModel } from "../src/infrastructure/database/models/Faculty.js";
 import { MajorModel } from "../src/infrastructure/database/models/Major.js";
 import { MoodModel } from "../src/infrastructure/database/models/Mood.js";
@@ -218,17 +218,17 @@ async function seedMockData(): Promise<void> {
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
@@ -264,20 +264,20 @@ async function seedMockData(): Promise<void> {
 
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
diff --git a/backend/src/application/services/ReactionService.ts b/backend/src/application/services/ReactionService.ts
index 75c78f6..ed5cc68 100644
--- a/backend/src/application/services/ReactionService.ts
+++ b/backend/src/application/services/ReactionService.ts
@@ -1,21 +1,22 @@
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
@@ -36,27 +37,46 @@ export class ReactionService {
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
 
@@ -64,15 +84,28 @@ export class ReactionService {
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
 
@@ -84,10 +117,10 @@ export class ReactionService {
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
@@ -1,16 +1,22 @@
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
@@ -20,11 +26,16 @@ export function createReactionController(reactionService: ReactionService) {
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
diff --git a/backend/src/domain/constants/engagementConstants.ts b/backend/src/domain/constants/engagementConstants.ts
index 805f62b..4a9c2f6 100644
--- a/backend/src/domain/constants/engagementConstants.ts
+++ b/backend/src/domain/constants/engagementConstants.ts
@@ -2,8 +2,18 @@ export const COMMENT_CONTENT_MIN_LENGTH = 1;
 export const COMMENT_CONTENT_MAX_LENGTH = 2000;
 export const COMMENT_MAX_THREAD_DEPTH = 3;
 
-export const REACTION_TYPES = ["empathy", "support", "relate", "solidarity"] as const;
-export type ReactionType = (typeof REACTION_TYPES)[number];
+export const DEFAULT_REACTION_EMOJIS = ["=ƒÆÖ", "=ƒñ¥", "=ƒ½é", "G£è"] as const;
+export type DefaultReactionEmoji = (typeof DEFAULT_REACTION_EMOJIS)[number];
+
+export const MAX_REACTIONS_PER_USER = 7;
+export const EMOJI_MAX_LENGTH = 8;
+
+export const LEGACY_REACTION_SLUG_TO_EMOJI = {
+  empathy: "=ƒÆÖ",
+  support: "=ƒñ¥",
+  relate: "=ƒ½é",
+  solidarity: "G£è",
+} as const;
 
 export const REPORT_REASON_CODES = [
   "harassment",
diff --git a/backend/src/domain/entities/Reaction.ts b/backend/src/domain/entities/Reaction.ts
index 0a62668..2861cb2 100644
--- a/backend/src/domain/entities/Reaction.ts
+++ b/backend/src/domain/entities/Reaction.ts
@@ -1,5 +1,3 @@
-import type { ReactionType } from "../constants/engagementConstants.js";
-
 export type ReactionTargetType = "mood" | "comment";
 
 export interface Reaction {
@@ -7,20 +5,28 @@ export interface Reaction {
   userId: string;
   targetType: ReactionTargetType;
   targetId: string;
-  reactionType: ReactionType;
+  emoji: string;
   createdAt: Date;
   updatedAt: Date;
 }
 
-export interface UpsertReactionInput {
+export interface ToggleReactionInput {
   userId: string;
   targetType: ReactionTargetType;
   targetId: string;
-  reactionType: ReactionType;
+  emoji: string;
 }
 
 export interface RemoveReactionInput {
   userId: string;
   targetType: ReactionTargetType;
   targetId: string;
+  emoji: string;
+}
+
+export interface ReactionMutationResult {
+  emoji: string | null;
+  toggledOn: boolean;
+  reactionSummary: Record<string, number>;
+  userReactions: string[];
 }
diff --git a/backend/src/domain/ports/ICommentRepository.ts b/backend/src/domain/ports/ICommentRepository.ts
index 1800f98..6115ac1 100644
--- a/backend/src/domain/ports/ICommentRepository.ts
+++ b/backend/src/domain/ports/ICommentRepository.ts
@@ -18,5 +18,5 @@ export interface ICommentRepository {
   isAuthor(commentId: string, authorId: string): Promise<boolean>;
   findActiveByIdOnMood(commentId: string, moodId: string): Promise<Comment | null>;
   findOwnedCommentIds(commentIds: string[], authorId: string): Promise<Set<string>>;
-  adjustReactionSummary(commentId: string, reactionType: string, delta: number): Promise<Record<string, number>>;
+  adjustReactionSummary(commentId: string, emoji: string, delta: number): Promise<Record<string, number>>;
 }
diff --git a/backend/src/domain/ports/IMoodRepository.ts b/backend/src/domain/ports/IMoodRepository.ts
index d7b7f21..207510a 100644
--- a/backend/src/domain/ports/IMoodRepository.ts
+++ b/backend/src/domain/ports/IMoodRepository.ts
@@ -62,7 +62,7 @@ export interface IMoodRepository {
   isAuthor(moodId: string, authorId: string): Promise<boolean>;
   incrementCommentCount(moodId: string): Promise<void>;
   decrementCommentCount(moodId: string): Promise<void>;
-  adjustReactionSummary(moodId: string, reactionType: string, delta: number): Promise<Record<string, number>>;
+  adjustReactionSummary(moodId: string, emoji: string, delta: number): Promise<Record<string, number>>;
   incrementReportCount(moodId: string): Promise<void>;
   isActive(moodId: string): Promise<boolean>;
   moderateRemove(moodId: string, adminId: string, moderationNote: string | null): Promise<MoodWithRelations | null>;
diff --git a/backend/src/domain/ports/IReactionRepository.ts b/backend/src/domain/ports/IReactionRepository.ts
index 54e6dd9..a19f6ad 100644
--- a/backend/src/domain/ports/IReactionRepository.ts
+++ b/backend/src/domain/ports/IReactionRepository.ts
@@ -1,24 +1,24 @@
 import type {
   Reaction,
+  ReactionMutationResult,
   RemoveReactionInput,
   ReactionTargetType,
-  UpsertReactionInput,
+  ToggleReactionInput,
 } from "../entities/Reaction.js";
-import type { ReactionType } from "../constants/engagementConstants.js";
-
-export interface ReactionUpsertResult {
-  reactionType: ReactionType | null;
-  reactionSummary: Record<string, number>;
-}
 
 export interface IReactionRepository {
-  upsert(input: UpsertReactionInput): Promise<ReactionUpsertResult>;
-  remove(input: RemoveReactionInput): Promise<ReactionUpsertResult>;
-  findUserReaction(
+  toggle(input: ToggleReactionInput): Promise<ReactionMutationResult>;
+  remove(input: RemoveReactionInput): Promise<ReactionMutationResult>;
+  findUserReactions(
+    userId: string,
+    targetType: ReactionTargetType,
+    targetId: string,
+  ): Promise<string[]>;
+  countUserReactions(
     userId: string,
     targetType: ReactionTargetType,
     targetId: string,
-  ): Promise<ReactionType | null>;
+  ): Promise<number>;
   getReactionSummary(
     targetType: ReactionTargetType,
     targetId: string,
diff --git a/backend/src/domain/utils/isValidReactionEmoji.ts b/backend/src/domain/utils/isValidReactionEmoji.ts
new file mode 100644
index 0000000..37fc704
--- /dev/null
+++ b/backend/src/domain/utils/isValidReactionEmoji.ts
@@ -0,0 +1,10 @@
+import { EMOJI_MAX_LENGTH } from "../constants/engagementConstants.js";
+
+export function isValidReactionEmoji(value: string): boolean {
+  const emoji = value.trim();
+  if (!emoji || emoji.length > EMOJI_MAX_LENGTH) return false;
+  if (/^[a-zA-Z0-9_\-\s./:]+$/.test(emoji)) return false;
+  const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
+  const graphemes = [...segmenter.segment(emoji)];
+  return graphemes.length === 1;
+}
diff --git a/backend/src/infrastructure/database/models/Reaction.ts b/backend/src/infrastructure/database/models/Reaction.ts
index 64c0c5f..90a617b 100644
--- a/backend/src/infrastructure/database/models/Reaction.ts
+++ b/backend/src/infrastructure/database/models/Reaction.ts
@@ -1,18 +1,21 @@
 import { Schema, model, type InferSchemaType, type Types } from "mongoose";
-import { REACTION_TYPES } from "../../../domain/constants/engagementConstants.js";
 
 const reactionSchema = new Schema(
   {
     userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
     targetType: { type: String, required: true, enum: ["mood", "comment"] },
     targetId: { type: Schema.Types.ObjectId, required: true },
-    reactionType: { type: String, required: true, enum: REACTION_TYPES },
+    emoji: { type: String, required: true, maxlength: 8 },
   },
   { timestamps: true, collection: "reactions" },
 );
 
-reactionSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
+reactionSchema.index(
+  { userId: 1, targetType: 1, targetId: 1, emoji: 1 },
+  { unique: true },
+);
 reactionSchema.index({ targetType: 1, targetId: 1 });
+reactionSchema.index({ userId: 1, targetType: 1, targetId: 1 });
 
 export type ReactionDocument = InferSchemaType<typeof reactionSchema> & {
   userId: Types.ObjectId;
diff --git a/backend/src/infrastructure/database/repositories/MongooseCommentRepository.ts b/backend/src/infrastructure/database/repositories/MongooseCommentRepository.ts
index b587e7b..465502e 100644
--- a/backend/src/infrastructure/database/repositories/MongooseCommentRepository.ts
+++ b/backend/src/infrastructure/database/repositories/MongooseCommentRepository.ts
@@ -146,10 +146,10 @@ export class MongooseCommentRepository implements ICommentRepository {
 
   async adjustReactionSummary(
     commentId: string,
-    reactionType: string,
+    emoji: string,
     delta: number,
   ): Promise<Record<string, number>> {
-    const key = `reactionSummary.${reactionType}`;
+    const key = `reactionSummary.${emoji}`;
     const updated = await CommentModel.findOneAndUpdate(
       { _id: commentId },
       { $inc: { [key]: delta } },
diff --git a/backend/src/infrastructure/database/repositories/MongooseMoodRepository.ts b/backend/src/infrastructure/database/repositories/MongooseMoodRepository.ts
index 02f5dbc..8869f63 100644
--- a/backend/src/infrastructure/database/repositories/MongooseMoodRepository.ts
+++ b/backend/src/infrastructure/database/repositories/MongooseMoodRepository.ts
@@ -335,10 +335,10 @@ export class MongooseMoodRepository implements IMoodRepository {
 
   async adjustReactionSummary(
     moodId: string,
-    reactionType: string,
+    emoji: string,
     delta: number,
   ): Promise<Record<string, number>> {
-    const key = `reactionSummary.${reactionType}`;
+    const key = `reactionSummary.${emoji}`;
     const updated = await MoodModel.findOneAndUpdate(
       { _id: moodId },
       { $inc: { [key]: delta }, $set: { lastActivityAt: new Date() } },
diff --git a/backend/src/infrastructure/database/repositories/MongooseReactionRepository.ts b/backend/src/infrastructure/database/repositories/MongooseReactionRepository.ts
index 0b0a31a..4f208a7 100644
--- a/backend/src/infrastructure/database/repositories/MongooseReactionRepository.ts
+++ b/backend/src/infrastructure/database/repositories/MongooseReactionRepository.ts
@@ -1,13 +1,12 @@
-import type { ReactionType } from "../../../domain/constants/engagementConstants.js";
 import type {
+  ReactionMutationResult,
   RemoveReactionInput,
   ReactionTargetType,
-  UpsertReactionInput,
+  ToggleReactionInput,
 } from "../../../domain/entities/Reaction.js";
-import type {
-  IReactionRepository,
-  ReactionUpsertResult,
-} from "../../../domain/ports/IReactionRepository.js";
+import { MAX_REACTIONS_PER_USER } from "../../../domain/constants/engagementConstants.js";
+import { AppError } from "../../../domain/errors/AppError.js";
+import type { IReactionRepository } from "../../../domain/ports/IReactionRepository.js";
 import { CommentModel } from "../models/Comment.js";
 import { MoodModel } from "../models/Mood.js";
 import { ReactionModel } from "../models/Reaction.js";
@@ -28,10 +27,10 @@ async function getTargetSummary(
 async function adjustTargetSummary(
   targetType: ReactionTargetType,
   targetId: string,
-  reactionType: string,
+  emoji: string,
   delta: number,
 ): Promise<Record<string, number>> {
-  const key = `reactionSummary.${reactionType}`;
+  const key = `reactionSummary.${emoji}`;
 
   if (targetType === "mood") {
     const updated = await MoodModel.findOneAndUpdate(
@@ -52,84 +51,136 @@ async function adjustTargetSummary(
 }
 
 export class MongooseReactionRepository implements IReactionRepository {
-  async upsert(input: UpsertReactionInput): Promise<ReactionUpsertResult> {
+  async toggle(input: ToggleReactionInput): Promise<ReactionMutationResult> {
     const existing = await ReactionModel.findOne({
       userId: input.userId,
       targetType: input.targetType,
       targetId: input.targetId,
+      emoji: input.emoji,
     });
 
     if (existing) {
-      if (existing.reactionType === input.reactionType) {
-        return {
-          reactionType: input.reactionType,
-          reactionSummary: await getTargetSummary(input.targetType, input.targetId),
-        };
-      }
-
-      const oldType = existing.reactionType;
-      existing.reactionType = input.reactionType;
-      await existing.save();
-
-      await adjustTargetSummary(input.targetType, input.targetId, oldType, -1);
+      await existing.deleteOne();
       const reactionSummary = await adjustTargetSummary(
         input.targetType,
         input.targetId,
-        input.reactionType,
-        1,
+        input.emoji,
+        -1,
+      );
+      const userReactions = await this.findUserReactions(
+        input.userId,
+        input.targetType,
+        input.targetId,
       );
 
-      return { reactionType: input.reactionType, reactionSummary };
+      return {
+        emoji: input.emoji,
+        toggledOn: false,
+        reactionSummary,
+        userReactions,
+      };
     }
 
-    await ReactionModel.create({
+    const created = await ReactionModel.create({
       userId: input.userId,
       targetType: input.targetType,
       targetId: input.targetId,
-      reactionType: input.reactionType,
+      emoji: input.emoji,
     });
 
     const reactionSummary = await adjustTargetSummary(
       input.targetType,
       input.targetId,
-      input.reactionType,
+      input.emoji,
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
 
-    return { reactionType: input.reactionType, reactionSummary };
+    const userReactions = await this.findUserReactions(
+      input.userId,
+      input.targetType,
+      input.targetId,
+    );
+
+    return {
+      emoji: input.emoji,
+      toggledOn: true,
+      reactionSummary,
+      userReactions,
+    };
   }
 
-  async remove(input: RemoveReactionInput): Promise<ReactionUpsertResult> {
+  async remove(input: RemoveReactionInput): Promise<ReactionMutationResult> {
     const existing = await ReactionModel.findOneAndDelete({
       userId: input.userId,
       targetType: input.targetType,
       targetId: input.targetId,
+      emoji: input.emoji,
     });
 
     if (!existing) {
+      const [reactionSummary, userReactions] = await Promise.all([
+        getTargetSummary(input.targetType, input.targetId),
+        this.findUserReactions(input.userId, input.targetType, input.targetId),
+      ]);
+
       return {
-        reactionType: null,
-        reactionSummary: await getTargetSummary(input.targetType, input.targetId),
+        emoji: null,
+        toggledOn: false,
+        reactionSummary,
+        userReactions,
       };
     }
 
     const reactionSummary = await adjustTargetSummary(
       input.targetType,
       input.targetId,
-      existing.reactionType,
+      input.emoji,
       -1,
     );
+    const userReactions = await this.findUserReactions(
+      input.userId,
+      input.targetType,
+      input.targetId,
+    );
 
-    return { reactionType: null, reactionSummary };
+    return {
+      emoji: null,
+      toggledOn: false,
+      reactionSummary,
+      userReactions,
+    };
+  }
+
+  async findUserReactions(
+    userId: string,
+    targetType: ReactionTargetType,
+    targetId: string,
+  ): Promise<string[]> {
+    const reactions = await ReactionModel.find({ userId, targetType, targetId })
+      .select("emoji")
+      .lean();
+    return reactions.map((reaction) => reaction.emoji);
   }
 
-  async findUserReaction(
+  async countUserReactions(
     userId: string,
     targetType: ReactionTargetType,
     targetId: string,
-  ): Promise<ReactionType | null> {
-    const reaction = await ReactionModel.findOne({ userId, targetType, targetId }).lean();
-    return (reaction?.reactionType as ReactionType | undefined) ?? null;
+  ): Promise<number> {
+    return ReactionModel.countDocuments({ userId, targetType, targetId });
   }
 
   async getReactionSummary(
diff --git a/backend/src/routes/reactionRoutes.ts b/backend/src/routes/reactionRoutes.ts
index 96628a7..3b34512 100644
--- a/backend/src/routes/reactionRoutes.ts
+++ b/backend/src/routes/reactionRoutes.ts
@@ -17,7 +17,7 @@ export function createReactionRoutes(deps: Dependencies): Router {
     authenticate,
     authorize("student", "administrator"),
     validate(upsertReactionSchema),
-    reactionController.upsert,
+    reactionController.toggle,
   );
 
   router.delete(
diff --git a/backend/src/validators/engagementSchemas.ts b/backend/src/validators/engagementSchemas.ts
index 8a7e051..2987272 100644
--- a/backend/src/validators/engagementSchemas.ts
+++ b/backend/src/validators/engagementSchemas.ts
@@ -2,7 +2,7 @@ import { z } from "zod";
 import {
   COMMENT_CONTENT_MAX_LENGTH,
   COMMENT_CONTENT_MIN_LENGTH,
-  REACTION_TYPES,
+  EMOJI_MAX_LENGTH,
   REPORT_DESCRIPTION_MAX_LENGTH,
   REPORT_REASON_CODES,
   SEARCH_QUERY_MIN_LENGTH,
@@ -30,12 +30,13 @@ export const moodIdParamSchema = z.object({
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
diff --git a/backend/tests/integration/engagement.test.ts b/backend/tests/integration/engagement.test.ts
index a6e0b54..c8bf77b 100644
--- a/backend/tests/integration/engagement.test.ts
+++ b/backend/tests/integration/engagement.test.ts
@@ -50,7 +50,18 @@ describe("Engagement routes", () => {
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
diff --git a/backend/tests/unit/anonymityContract.test.ts b/backend/tests/unit/anonymityContract.test.ts
index 061ddca..9920c4f 100644
--- a/backend/tests/unit/anonymityContract.test.ts
+++ b/backend/tests/unit/anonymityContract.test.ts
@@ -28,7 +28,7 @@ const sampleMood: MoodWithRelations = {
   majorId: "665a1b2c3d4e5f6789012346",
   status: "active",
   commentCount: 5,
-  reactionSummary: { empathy: 12, support: 8 },
+  reactionSummary: { "=ƒÆÖ": 12, "=ƒñ¥": 8 },
   imageCount: 1,
   primaryTagId: "665a1b2c3d4e5f6789012349",
   reportCount: 0,
@@ -57,7 +57,7 @@ const sampleComment: Comment = {
   content: "You are not alone.",
   depth: 0,
   status: "active",
-  reactionSummary: { empathy: 2 },
+  reactionSummary: { "=ƒÆÖ": 2 },
   createdAt: new Date("2026-07-05T09:00:00.000Z"),
   updatedAt: new Date("2026-07-05T09:00:00.000Z"),
   deletedAt: null,
diff --git a/backend/tests/unit/commentMapper.test.ts b/backend/tests/unit/commentMapper.test.ts
index f13a814..2f51845 100644
--- a/backend/tests/unit/commentMapper.test.ts
+++ b/backend/tests/unit/commentMapper.test.ts
@@ -12,7 +12,7 @@ const sampleComment: Comment = {
   parentId: null,
   content: "You're not alone in this.",
   status: "active",
-  reactionSummary: { support: 3 },
+  reactionSummary: { "=ƒñ¥": 3 },
   depth: 0,
   createdAt: new Date("2026-07-05T09:00:00.000Z"),
   updatedAt: new Date("2026-07-05T09:00:00.000Z"),
@@ -28,7 +28,7 @@ describe("commentMapper", () => {
       content: sampleComment.content,
       parentId: null,
       depth: 0,
-      reactionSummary: { support: 3 },
+      reactionSummary: { "=ƒñ¥": 3 },
       createdAt: "2026-07-05T09:00:00.000Z",
     });
 
diff --git a/backend/tests/unit/isValidReactionEmoji.test.ts b/backend/tests/unit/isValidReactionEmoji.test.ts
new file mode 100644
index 0000000..4ee7dea
--- /dev/null
+++ b/backend/tests/unit/isValidReactionEmoji.test.ts
@@ -0,0 +1,19 @@
+import { describe, expect, it } from "vitest";
+import { isValidReactionEmoji } from "../../src/domain/utils/isValidReactionEmoji.js";
+
+describe("isValidReactionEmoji", () => {
+  it("accepts single emoji graphemes", () => {
+    expect(isValidReactionEmoji("=ƒÆÖ")).toBe(true);
+    expect(isValidReactionEmoji("=ƒöÑ")).toBe(true);
+    expect(isValidReactionEmoji("=ƒÅ¦n+ÅGÇì=ƒîê")).toBe(true);
+  });
+
+  it("rejects empty, ascii words, multi-grapheme text, and overlong values", () => {
+    expect(isValidReactionEmoji("")).toBe(false);
+    expect(isValidReactionEmoji("empathy")).toBe(false);
+    expect(isValidReactionEmoji("ok")).toBe(false);
+    expect(isValidReactionEmoji("https://x")).toBe(false);
+    expect(isValidReactionEmoji("=ƒÆÖ=ƒöÑ")).toBe(false);
+    expect(isValidReactionEmoji("=ƒÿÇ=ƒÿÇ=ƒÿÇ=ƒÿÇ=ƒÿÇ=ƒÿÇ=ƒÿÇ=ƒÿÇ=ƒÿÇ")).toBe(false);
+  });
+});
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
@@ -10,7 +10,7 @@ const sampleMood: MoodWithRelations = {
   majorId: "665a1b2c3d4e5f6789012346",
   status: "active",
   commentCount: 5,
-  reactionSummary: { empathy: 12, support: 8 },
+  reactionSummary: { "=ƒÆÖ": 12, "=ƒñ¥": 8 },
   imageCount: 1,
   primaryTagId: "665a1b2c3d4e5f6789012349",
   reportCount: 0,
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
diff --git a/docs/api.md b/docs/api.md
index d0942b4..f02499d 100644
--- a/docs/api.md
+++ b/docs/api.md
@@ -810,7 +810,7 @@ All public mood responses use this shape GÇö **no author identity**:
     { "id": "...", "slug": "stress", "name": "Stress", "isPrimary": true }
   ],
   "commentCount": 5,
-  "reactionSummary": { "empathy": 12, "support": 8 },
+  "reactionSummary": { "=ƒÆÖ": 12, "=ƒñ¥": 8 },
   "imageCount": 1,
   "images": [
     { "id": "...", "sortOrder": 0 }
@@ -1295,7 +1295,7 @@ Validation occurs within **Generate Presigned Upload URL** (pre-upload) and **Co
       "content": "You're not alone in this.",
       "parentId": null,
       "depth": 0,
-      "reactionSummary": { "support": 3 },
+      "reactionSummary": { "=ƒñ¥": 3 },
       "createdAt": "2026-07-05T09:00:00.000Z"
     }
   ],
@@ -1413,11 +1413,15 @@ Cursor pagination on `GET /moods/:moodId/comments` per global strategy.
 
 ## Reaction APIs
 
-### Add or Update Reaction
+Reactions use **Unicode emoji** as keys. Each authenticated user may have up to **7 distinct emoji** per mood or comment. Default UI shortcuts: `=ƒÆÖ`, `=ƒñ¥`, `=ƒ½é`, `G£è` (mapped from legacy slugs `empathy`, `support`, `relate`, `solidarity`). Users may add any valid single-emoji grapheme on a target; custom emojis appear in `reactionSummary` for that target only when count > 0.
+
+---
+
+### Toggle Reaction
 
 | | |
 |---|---|
-| **Purpose** | Set reaction on mood or comment (`FR-REACT-001`, `FR-REACT-003`) |
+| **Purpose** | Add or remove one emoji reaction on a mood or comment (`FR-REACT-001`, `FR-REACT-003`) |
 | **Method** | `PUT` |
 | **Endpoint** | `/api/v1/reactions` |
 | **Authentication** | Yes |
@@ -1429,15 +1433,15 @@ Cursor pagination on `GET /moods/:moodId/comments` per global strategy.
 {
   "targetType": "mood",
   "targetId": "665a1b2c3d4e5f6789012348",
-  "reactionType": "empathy"
+  "emoji": "=ƒÆÖ"
 }
 ```
 
 **Validation Rules:**
 
 - `targetType`: `mood` | `comment`
-- `reactionType`: active allowlist GÇö `empathy`, `support`, `relate`, `solidarity` (`OD-007` default set)
 - `targetId`: valid active target
+- `emoji`: required string, max 8 UTF-16 code units; must be a single emoji grapheme (plain text, URLs, and ASCII slugs rejected)
 
 **Success Response:** `200`
 
@@ -1447,13 +1451,25 @@ Cursor pagination on `GET /moods/:moodId/comments` per global strategy.
   "data": {
     "targetType": "mood",
     "targetId": "665a1b2c3d4e5f6789012348",
-    "reactionType": "empathy",
-    "reactionSummary": { "empathy": 13, "support": 8 }
+    "emoji": "=ƒÆÖ",
+    "toggledOn": true,
+    "reactionSummary": { "=ƒÆÖ": 13, "=ƒñ¥": 8 },
+    "userReactions": ["=ƒÆÖ", "=ƒöÑ"]
   }
 }
 ```
 
-**Business Rules:** Upsert GÇö one reaction per user per target. Updates `reactionSummary` on target. Never exposes who reacted (`FR-REACT-004`).
+- `toggledOn`: `true` when the emoji was added; `false` when removed via toggle
+- `userReactions`: caller's current emoji set on this target (always present for authenticated writes)
+
+**Error Responses:** `401`, `404` (`MOOD_NOT_FOUND`, `COMMENT_NOT_FOUND`), `422` (`VALIDATION_FAILED`, `REACTION_LIMIT_REACHED`)
+
+**Business Rules:**
+
+- **Toggle:** if the caller already has this emoji on the target, the reaction is removed; otherwise it is added
+- **Limit:** adding an eighth distinct emoji returns `422` `REACTION_LIMIT_REACHED` with no change
+- Updates denormalized `reactionSummary` on the target (emoji GåÆ count)
+- Never exposes who reacted beyond the caller's own `userReactions` (`FR-REACT-004`)
 
 **Related Collections:** `reactions`, `moods`, `comments`
 
@@ -1463,7 +1479,7 @@ Cursor pagination on `GET /moods/:moodId/comments` per global strategy.
 
 | | |
 |---|---|
-| **Purpose** | Remove user's reaction |
+| **Purpose** | Explicitly remove one emoji reaction for the caller |
 | **Method** | `DELETE` |
 | **Endpoint** | `/api/v1/reactions` |
 | **Authentication** | Yes |
@@ -1474,11 +1490,30 @@ Cursor pagination on `GET /moods/:moodId/comments` per global strategy.
 ```json
 {
   "targetType": "mood",
-  "targetId": "665a1b2c3d4e5f6789012348"
+  "targetId": "665a1b2c3d4e5f6789012348",
+  "emoji": "=ƒÆÖ"
+}
+```
+
+**Validation Rules:** Same `targetType`, `targetId`, and `emoji` rules as Toggle Reaction.
+
+**Success Response:** `200`
+
+```json
+{
+  "success": true,
+  "data": {
+    "targetType": "mood",
+    "targetId": "665a1b2c3d4e5f6789012348",
+    "emoji": null,
+    "toggledOn": false,
+    "reactionSummary": { "=ƒñ¥": 8 },
+    "userReactions": ["=ƒöÑ"]
+  }
 }
 ```
 
-**Success Response:** `200` GÇö Updated `reactionSummary` counts.
+If the caller did not have the emoji, response returns unchanged `reactionSummary` and `userReactions` (idempotent no-op).
 
 **Related Collections:** `reactions`, `moods`, `comments`
 
@@ -1504,13 +1539,13 @@ Cursor pagination on `GET /moods/:moodId/comments` per global strategy.
   "data": {
     "targetType": "mood",
     "targetId": "665a1b2c3d4e5f6789012348",
-    "reactionSummary": { "empathy": 12, "support": 8 },
-    "userReaction": "empathy"
+    "reactionSummary": { "=ƒÆÖ": 12, "=ƒñ¥": 8, "=ƒöÑ": 3 },
+    "userReactions": ["=ƒÆÖ", "=ƒöÑ"]
   }
 }
 ```
 
-`userReaction` included only when authenticated GÇö reveals caller's own reaction only, not others.
+`userReactions` is included only when authenticated GÇö array of emoji the caller has on this target. Anonymous callers receive `userReactions: []`. Never exposes other users' reactions.
 
 **Related Collections:** `reactions`
 
@@ -2399,6 +2434,7 @@ Includes `reporterId` (admin only), full content snapshot, target metadata.
 | `ADMIN_PROTECTED` | 409 | Cannot suspend administrators |
 | `CANNOT_CHANGE_OWN_ROLE` | 409 | Admin cannot change own role |
 | `LAST_ADMIN_PROTECTED` | 409 | Cannot demote the last administrator |
+| `REACTION_LIMIT_REACHED` | 422 | User already has 7 distinct emoji on target |
 | `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
 | `INTERNAL_ERROR` | 500 | Server error |
 
@@ -2451,7 +2487,7 @@ Aligned with README Future Improvements GÇö not implemented in v1.
 | ID | Resolution |
 |----|------------|
 | `OD-005` | Cursor-based pagination on all list endpoints |
-| `OD-007` | Default reaction types: `empathy`, `support`, `relate`, `solidarity` |
+| `OD-007` | Emoji reactions: up to 7 per user per target; default UI shortcuts `=ƒÆÖ`, `=ƒñ¥`, `=ƒ½é`, `G£è`; any valid single emoji allowed |
 | `OD-012` | Default mood edit window: 24 hours from `createdAt` |
 
 Decisions `OD-002`, `OD-003`, `OD-009`, `OD-013`, `OD-014` remain as documented TBDs in endpoint authorization and validation notes.
diff --git a/docs/database.md b/docs/database.md
index 7b48dc1..786e2cc 100644
--- a/docs/database.md
+++ b/docs/database.md
@@ -108,7 +108,7 @@ The schema uses a **hybrid approach** GÇö normalized references for entities wit
 | 4 | `moods` | Anonymous mood posts |
 | 5 | `moodimages` | R2 image metadata (no binaries) |
 | 6 | `comments` | Anonymous comments on moods |
-| 7 | `reactions` | One reaction per user per target |
+| 7 | `reactions` | Up to 7 distinct emoji per user per target |
 | 8 | `reports` | User-flagged content for moderation |
 | 9 | `notifications` | In-app user notifications |
 | 10 | `bookmarks` | Private user-to-mood saves |
@@ -324,7 +324,7 @@ Core content entity GÇö anonymous mood posts containing text, optional images (v
 | `majorId` | ObjectId | | G£ô | `null` | Major context |
 | `status` | String | G£ô | | `active` | `active`, `hidden`, `moderated_removed`, `deleted_by_author` |
 | `commentCount` | Number | G£ô | | `0` | Denormalized count of active comments |
-| `reactionSummary` | Object | G£ô | | `{}` | Map of `reactionType GåÆ count` (e.g., `{ "empathy": 12 }`) |
+| `reactionSummary` | Object | G£ô | | `{}` | Map of `emoji GåÆ count` (e.g., `{ "=ƒÆÖ": 12, "=ƒöÑ": 3 }`) |
 | `imageCount` | Number | G£ô | | `0` | Denormalized count of confirmed images |
 | `primaryTagId` | ObjectId | | G£ô | `null` | Denormalized primary emotion tag for feed badge display |
 | `reportCount` | Number | G£ô | | `0` | Open + resolved reports count (admin signal) |
@@ -472,7 +472,7 @@ Anonymous comments on mood posts (`FR-CMT-*`).
 | `parentId` | ObjectId | | G£ô | `null` | Parent comment for threading (`FR-CMT-004` TBD) |
 | `content` | String | G£ô | | | Comment text |
 | `status` | String | G£ô | | `active` | `active`, `moderated_removed`, `deleted_by_author` |
-| `reactionSummary` | Object | G£ô | | `{}` | Denormalized reaction counts |
+| `reactionSummary` | Object | G£ô | | `{}` | Denormalized emoji reaction counts |
 | `depth` | Number | G£ô | | `0` | Thread depth (0 = top-level) |
 | `moderatedAt` | Date | | G£ô | `null` | |
 | `moderatedBy` | ObjectId | | G£ô | `null` | |
@@ -522,7 +522,7 @@ Anonymous comments on mood posts (`FR-CMT-*`).
 
 #### Purpose
 
-Stores one reaction per user per target (mood or comment). Changing reaction updates existing document (`FR-REACT-003`).
+Stores emoji reactions on mood posts and comments. Each user may have **up to 7 distinct emoji** per target; one document per `(userId, targetType, targetId, emoji)` (`FR-REACT-001`, `FR-REACT-003`).
 
 #### Fields
 
@@ -532,24 +532,25 @@ Stores one reaction per user per target (mood or comment). Changing reaction upd
 | `userId` | ObjectId | G£ô | | | **Internal only** GÇö ref `users` |
 | `targetType` | String | G£ô | | | `mood` or `comment` |
 | `targetId` | ObjectId | G£ô | | | Polymorphic ref |
-| `reactionType` | String | G£ô | | | Slug e.g., `empathy`, `support`, `relate` (admin-configurable `FR-REACT-005`) |
+| `emoji` | String | G£ô | | | Unicode emoji grapheme (max 8 UTF-16 code units) |
 | `createdAt` | Date | G£ô | | auto | |
-| `updatedAt` | Date | G£ô | | auto | Updated when reaction type changes |
+| `updatedAt` | Date | G£ô | | auto | Set when reaction row is created (toggle add/remove creates/deletes rows) |
 
 #### Validation Rules
 
 - `targetType`: enum `mood` | `comment`
 - `targetId`: must reference existing document of matching type and active status
-- `reactionType`: must be in active reaction type allowlist
-- Unique constraint: one document per `(userId, targetType, targetId)`
+- `emoji`: single emoji grapheme; ASCII slugs and plain text rejected at API layer
+- Unique constraint: one document per `(userId, targetType, targetId, emoji)`
+- Application cap: at most **7** documents per `(userId, targetType, targetId)`
 
 #### Indexes
 
 | Index | Type | Purpose |
 |-------|------|---------|
-| `{ userId: 1, targetType: 1, targetId: 1 }` | Unique compound | One reaction per user per target |
-| `{ targetType: 1, targetId: 1 }` | Compound | Count aggregation fallback |
-| `{ targetType: 1, targetId: 1, reactionType: 1 }` | Compound | Reaction type breakdown |
+| `{ userId: 1, targetType: 1, targetId: 1, emoji: 1 }` | Unique compound | One row per emoji per user per target |
+| `{ targetType: 1, targetId: 1 }` | Compound | Summary aggregation fallback |
+| `{ userId: 1, targetType: 1, targetId: 1 }` | Compound | Count user reactions on target (limit enforcement) |
 
 #### Relationships
 
@@ -564,10 +565,13 @@ Stores one reaction per user per target (mood or comment). Changing reaction upd
 
 #### Business Rules
 
-- Upsert on react: insert or update `reactionType` (`FR-REACT-003`)
-- Application service updates `reactionSummary` on target document
+- `PUT /reactions` **toggles** one emoji: insert and `$inc` summary on add; delete row and decrement on remove if already owned
+- Eighth distinct emoji on a target rejected with `REACTION_LIMIT_REACHED` (`422`)
+- Application service updates `reactionSummary` on target document (emoji keys)
+- Default UI shortcuts `=ƒÆÖ`, `=ƒñ¥`, `=ƒ½é`, `G£è` are presentation-only; any valid emoji may appear in storage
 - Public API returns counts only GÇö never `userId` or per-user reaction lists (`FR-REACT-004`, `BR-ANON-002`)
-- Removing reaction deletes document and decrements summary
+- Authenticated read returns caller's `userReactions: string[]` only
+- Legacy slug `reactionType` values migrated to `emoji` via one-time script (`migrate:reaction-emojis`)
 
 ---
 
@@ -1085,7 +1089,7 @@ auditlogs GöÇGöÇGû¦ users (adminId)
 | Mood GåÆ Images | 1:N (0+ allowed) |
 | Mood GåÆ Tags | N:M via `moodtags` |
 | Mood GåÆ Comments | 1:N |
-| User GåÆ Reaction per target | 1:1 per target (unique) |
+| User GåÆ Reaction per target | 1:N (max 7 emoji) |
 | User GåÆ Bookmark per mood | 1:1 (unique) |
 | Faculty GåÆ Majors | 1:N |
 | Faculty GåÆ Moods | 1:N |
@@ -1112,7 +1116,7 @@ auditlogs GöÇGöÇGû¦ users (adminId)
 | `faculties` | `{ slug: 1 }` | URL routing |
 | `majors` | `{ facultyId: 1, slug: 1 }` | Scoped slug uniqueness |
 | `moodimages` | `{ objectKey: 1 }` | One DB row per R2 object |
-| `reactions` | `{ userId: 1, targetType: 1, targetId: 1 }` | One reaction per user per target |
+| `reactions` | `{ userId: 1, targetType: 1, targetId: 1, emoji: 1 }` | One row per emoji per user per target |
 | `bookmarks` | `{ userId: 1, moodId: 1 }` | One bookmark per pair |
 | `moodtags` | `{ moodId: 1, tagId: 1 }` | No duplicate tag on mood |
 | `tags` | `{ type: 1, slug: 1 }` | Unique tag slugs per type |
diff --git a/docs/glossary.md b/docs/glossary.md
index b1bf2b2..cffb144 100644
--- a/docs/glossary.md
+++ b/docs/glossary.md
@@ -103,10 +103,10 @@ Each entry includes:
 
 | | |
 |---|---|
-| **Definition** | A lightweight emotional response to a mood post or comment. Each user may have **at most one reaction per target**; changing reaction type updates the existing record. Default types: `empathy`, `support`, `relate`, `solidarity`. |
-| **Purpose** | Provides low-friction engagement without the overhead of writing a comment; reaction counts are visible without exposing who reacted. |
-| **Related Components** | `reactions` collection; `ReactionService`; `ReactionPicker`; `PUT /api/v1/reactions`; denormalized `reactionSummary` on moods/comments |
-| **Notes** | Public API returns aggregate counts only (`FR-REACT-004`). Authenticated users may see their own `userReaction` on a target. |
+| **Definition** | A lightweight emoji response to a mood post or comment. Each user may have **up to 7 distinct emoji** per target; one stored row per `(user, target, emoji)`. Default UI shortcuts: `=ƒÆÖ`, `=ƒñ¥`, `=ƒ½é`, `G£è` (legacy slugs: empathy, support, relate, solidarity). Any valid single Unicode emoji may be used on a target. |
+| **Purpose** | Provides low-friction, chat-style engagement without the overhead of writing a comment; reaction counts are visible without exposing who reacted. |
+| **Related Components** | `reactions` collection; `ReactionService`; `ReactionBar`; `PUT /api/v1/reactions`; denormalized `reactionSummary` on moods/comments |
+| **Notes** | Public API returns aggregate emoji counts only (`FR-REACT-004`). Authenticated users receive their own `userReactions: string[]`. Eighth distinct emoji returns `REACTION_LIMIT_REACHED`. |
 
 ---
 
diff --git a/docs/requirements.md b/docs/requirements.md
index 87d3a89..3a10c32 100644
--- a/docs/requirements.md
+++ b/docs/requirements.md
@@ -20,6 +20,7 @@ This document captures **resolved business rules** and **remaining open decision
 | **OD-009** | Student access to statistics dashboard | **Permitted.** Students, advisors, and administrators may access aggregated statistics and trending endpoints. All responses enforce `AGGREGATION_THRESHOLD_MIN`; no individual posts are exposed. Frontend routes `/statistics` and `/trending` require authentication (trending API is public read per `OD-002`). |
 | **OD-010** | Minimum aggregation threshold | **`AGGREGATION_THRESHOLD_MIN` default 5.** See [`security.md`](./security.md). |
 | **OD-011** | Advisor role: distinct vs. admin subset | **Distinct role.** Advisors have read-only access to statistics endpoints (same scope as students in v1.0). Advisors cannot access the admin namespace or moderation tools. Role assignment is administrative (Sprint 6 user management); registration defaults to `student`. |
+| **OD-007** | Predefined reaction types | **Resolved:** Unicode emoji keys; up to **7** distinct emoji per user per target; default UI shortcuts `=ƒÆÖ`, `=ƒñ¥`, `=ƒ½é`, `G£è`; any valid single emoji allowed. Toggle via `PUT /api/v1/reactions` with `{ emoji }`. See [`api.md`](./api.md) -ºReaction APIs and [`glossary.md`](./glossary.md) Reaction. |
 | **OD-012** | Post edit window | **24 hours** from `createdAt`. See [`api.md`](./api.md) Update Mood. |
 | **OD-013** | Faculty/major on posts | **Optional** on create. If omitted, application defaults from the author's `users.facultyId` / `users.majorId` when set. If both are provided, `majorId` must belong to `facultyId`. |
 | **OD-014** | University email domain restriction | **Configurable** via `ALLOWED_EMAIL_DOMAINS` (comma-separated). When unset, any valid email is accepted. When set, registration rejects non-matching domains with `422`. See [`authentication.md`](./authentication.md). |
@@ -49,7 +50,6 @@ Anonymous **comments**, **reactions**, and **bookmarks** are **student-only** wr
 | ID | Decision | Target phase | Notes |
 |----|----------|--------------|-------|
 | **OD-004** | Comment model: threaded vs. flat | Phase 2 | API supports `parentId`; max depth and default UX TBD. |
-| **OD-007** | Predefined reaction types | Phase 2 | Default set documented in [`glossary.md`](./glossary.md); admin configurability scope TBD. |
 | **OD-008** | Notification triggers and channels | Phase 3 | In-app minimum in v1; push deferred. |
 
 ---
diff --git a/frontend/src/components/EmojiPicker.tsx b/frontend/src/components/EmojiPicker.tsx
index c3435b7..274382b 100644
--- a/frontend/src/components/EmojiPicker.tsx
+++ b/frontend/src/components/EmojiPicker.tsx
@@ -1,6 +1,6 @@
 import { useTranslation } from "react-i18next";
-import { EMOTION_EMOJI_OPTIONS } from "../../lib/emotionEmoji";
-import { themeClasses } from "../../lib/themeClasses";
+import { EMOTION_EMOJI_OPTIONS } from "../lib/emotionEmoji";
+import { themeClasses } from "../lib/themeClasses";
 
 interface EmojiPickerProps {
   value: string;
diff --git a/frontend/src/components/MoodCard.tsx b/frontend/src/components/MoodCard.tsx
index 7604433..4317f2c 100644
--- a/frontend/src/components/MoodCard.tsx
+++ b/frontend/src/components/MoodCard.tsx
@@ -8,7 +8,6 @@ import { ROUTES } from "../constants/routes";
 import { useLocalizedName } from "../lib/useLocalizedName";
 import { useRelativeTime } from "../hooks/useRelativeTime";
 import { themeClasses } from "../lib/themeClasses";
-import { REACTION_TYPES } from "../types/engagement";
 import type { AnonymousMood } from "../types/mood";
 
 export const MoodCard = memo(function MoodCard({
@@ -25,8 +24,8 @@ export const MoodCard = memo(function MoodCard({
   const relativeTime = useRelativeTime(mood.createdAt);
 
   const primaryTag = mood.tags.find((tag) => tag.isPrimary) ?? mood.tags[0];
-  const totalReactions = REACTION_TYPES.reduce(
-    (sum, reaction) => sum + (mood.reactionSummary[reaction.type] ?? 0),
+  const totalReactions = Object.values(mood.reactionSummary ?? {}).reduce(
+    (sum, n) => sum + (typeof n === "number" ? n : 0),
     0,
   );
 
diff --git a/frontend/src/features/reactions/components/ReactionBar.test.tsx b/frontend/src/features/reactions/components/ReactionBar.test.tsx
new file mode 100644
index 0000000..02a28b3
--- /dev/null
+++ b/frontend/src/features/reactions/components/ReactionBar.test.tsx
@@ -0,0 +1,136 @@
+import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
+import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
+import { I18nextProvider } from "react-i18next";
+import { MemoryRouter } from "react-router-dom";
+import { beforeEach, describe, expect, it, vi } from "vitest";
+import i18n from "../../../lib/i18n";
+import type { ReactionView } from "../../../types/engagement";
+import { ReactionBar } from "./ReactionBar";
+
+vi.mock("../../../hooks/useAuth", () => ({
+  useAuth: () => ({ isAuthenticated: true }),
+}));
+
+vi.mock("../../../services/reactionService", () => ({
+  fetchReactions: vi.fn(),
+  toggleReaction: vi.fn(),
+}));
+
+import { fetchReactions, toggleReaction } from "../../../services/reactionService";
+
+const mockFetchReactions = vi.mocked(fetchReactions);
+const mockToggleReaction = vi.mocked(toggleReaction);
+
+function renderReactionBar(data: ReactionView) {
+  mockFetchReactions.mockResolvedValue(data);
+  const queryClient = new QueryClient({
+    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
+  });
+
+  return {
+    queryClient,
+    ...screen,
+    renderResult: (
+      <I18nextProvider i18n={i18n}>
+        <MemoryRouter>
+          <QueryClientProvider client={queryClient}>
+            <ReactionBar targetType="mood" targetId="mood-1" />
+          </QueryClientProvider>
+        </MemoryRouter>
+      </I18nextProvider>
+    ),
+  };
+}
+
+async function mountReactionBar(data: ReactionView) {
+  const setup = renderReactionBar(data);
+  render(setup.renderResult);
+  await screen.findByTitle("Empathy");
+  return setup;
+}
+
+const baseData: ReactionView = {
+  targetType: "mood",
+  targetId: "mood-1",
+  reactionSummary: {},
+  userReactions: [],
+};
+
+describe("ReactionBar", () => {
+  beforeEach(() => {
+    vi.clearAllMocks();
+  });
+
+  it("always renders the default reaction chips", async () => {
+    await mountReactionBar(baseData);
+
+    for (const emoji of ["=ƒÆÖ", "=ƒñ¥", "=ƒ½é", "G£è"]) {
+      expect(screen.getByRole("button", { name: emoji })).toBeInTheDocument();
+    }
+  });
+
+  it("marks an owned reaction chip active", async () => {
+    await mountReactionBar({
+      ...baseData,
+      reactionSummary: { "=ƒÆÖ": 2 },
+      userReactions: ["=ƒÆÖ"],
+    });
+
+    expect(screen.getByRole("button", { name: "=ƒÆÖ2" })).toHaveAttribute("aria-pressed", "true");
+  });
+
+  it("disables the add button at the reaction limit", async () => {
+    await mountReactionBar({
+      ...baseData,
+      userReactions: ["=ƒÆÖ", "=ƒñ¥", "=ƒ½é", "G£è", "=ƒÿÇ", "=ƒÑ¦", "=ƒîƒ"],
+    });
+
+    expect(screen.getByRole("button", { name: "Add reaction" })).toBeDisabled();
+  });
+
+  it("keeps the picker open and does not toggle invalid custom input", async () => {
+    await mountReactionBar(baseData);
+    fireEvent.click(screen.getByRole("button", { name: "Add reaction" }));
+    const dialog = screen.getByRole("dialog", { name: "Add reaction" });
+
+    fireEvent.change(within(dialog).getByRole("textbox"), { target: { value: "hello" } });
+    fireEvent.submit(within(dialog).getByRole("textbox").closest("form")!);
+
+    expect(screen.getByRole("dialog", { name: "Add reaction" })).toBeInTheDocument();
+    expect(screen.getByText("Enter one emoji (up to 8 characters)")).toBeInTheDocument();
+    expect(mockToggleReaction).not.toHaveBeenCalled();
+  });
+
+  it("closes on Escape and restores focus to the add button", async () => {
+    await mountReactionBar(baseData);
+    const addButton = screen.getByRole("button", { name: "Add reaction" });
+    fireEvent.click(addButton);
+
+    fireEvent.keyDown(document, { key: "Escape" });
+
+    expect(screen.queryByRole("dialog", { name: "Add reaction" })).not.toBeInTheDocument();
+    expect(addButton).toHaveFocus();
+  });
+
+  it("closes on an outside click and restores focus", async () => {
+    await mountReactionBar(baseData);
+    const addButton = screen.getByRole("button", { name: "Add reaction" });
+    fireEvent.click(addButton);
+
+    fireEvent.pointerDown(document.body);
+
+    expect(screen.queryByRole("dialog", { name: "Add reaction" })).not.toBeInTheDocument();
+    expect(addButton).toHaveFocus();
+  });
+
+  it("shows a mutation error", async () => {
+    mockToggleReaction.mockRejectedValue(new Error("network"));
+    await mountReactionBar(baseData);
+
+    fireEvent.click(screen.getByRole("button", { name: "=ƒÆÖ" }));
+
+    await waitFor(() => {
+      expect(screen.getByText("Could not update reaction")).toBeInTheDocument();
+    });
+  });
+});
diff --git a/frontend/src/features/reactions/components/ReactionBar.tsx b/frontend/src/features/reactions/components/ReactionBar.tsx
index 15c8390..de01e10 100644
--- a/frontend/src/features/reactions/components/ReactionBar.tsx
+++ b/frontend/src/features/reactions/components/ReactionBar.tsx
@@ -1,16 +1,15 @@
 import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
 import { useTranslation } from "react-i18next";
-import {
-  REACTION_TYPES,
-  getReactionTranslationKey,
-  type ReactionType,
-  type ReactionView,
-} from "../../../types/engagement";
+import { DEFAULT_REACTION_EMOJIS, type ReactionView } from "../../../types/engagement";
 import { queryKeys } from "../../../constants/queryKeys";
-import { fetchReactions, removeReaction, upsertReaction } from "../../../services/reactionService";
+import { fetchReactions, toggleReaction } from "../../../services/reactionService";
 import { useAuth } from "../../../hooks/useAuth";
 import { Link } from "react-router-dom";
 import { ROUTES } from "../../../constants/routes";
+import { themeClasses } from "../../../lib/themeClasses";
+import { ReactionEmojiPicker } from "./ReactionEmojiPicker";
+
+const MAX_USER_REACTIONS = 7;
 
 interface ReactionBarProps {
   targetType: "mood" | "comment";
@@ -29,13 +28,8 @@ export function ReactionBar({ targetType, targetId, compact = false }: ReactionB
   });
 
   const mutation = useMutation({
-    mutationFn: async (reactionType: ReactionType | null) => {
-      if (reactionType === null) {
-        return removeReaction(targetType, targetId);
-      }
-      return upsertReaction(targetType, targetId, reactionType);
-    },
-    onMutate: async (nextType) => {
+    mutationFn: (emoji: string) => toggleReaction(targetType, targetId, emoji),
+    onMutate: async (emoji) => {
       await queryClient.cancelQueries({ queryKey: queryKeys.reactions(targetType, targetId) });
       const previous = queryClient.getQueryData<ReactionView>(
         queryKeys.reactions(targetType, targetId),
@@ -43,16 +37,20 @@ export function ReactionBar({ targetType, targetId, compact = false }: ReactionB
 
       if (previous) {
         const summary = { ...previous.reactionSummary };
-        if (previous.userReaction) {
-          summary[previous.userReaction] = Math.max(0, (summary[previous.userReaction] ?? 1) - 1);
-        }
-        if (nextType) {
-          summary[nextType] = (summary[nextType] ?? 0) + 1;
+        const hadReaction = previous.userReactions.includes(emoji);
+        const userReactions = hadReaction
+          ? previous.userReactions.filter((e) => e !== emoji)
+          : [...previous.userReactions, emoji];
+
+        if (hadReaction) {
+          summary[emoji] = Math.max(0, (summary[emoji] ?? 1) - 1);
+        } else {
+          summary[emoji] = (summary[emoji] ?? 0) + 1;
         }
 
         queryClient.setQueryData<ReactionView>(queryKeys.reactions(targetType, targetId), {
           ...previous,
-          userReaction: nextType,
+          userReactions,
           reactionSummary: summary,
         });
       }
@@ -76,39 +74,67 @@ export function ReactionBar({ targetType, targetId, compact = false }: ReactionB
   const data = reactionsQuery.data;
   if (!data) return null;
 
-  const handleClick = (type: ReactionType) => {
+  const handleClick = (emoji: string) => {
     if (!isAuthenticated) return;
-    const next = data.userReaction === type ? null : type;
-    mutation.mutate(next);
+    const isOwned = data.userReactions.includes(emoji);
+    if (!isOwned && data.userReactions.length >= MAX_USER_REACTIONS) return;
+    mutation.mutate(emoji);
   };
 
+  const extraEmojis = Object.keys(data.reactionSummary).filter(
+    (emoji) =>
+      !DEFAULT_REACTION_EMOJIS.some((reaction) => reaction.emoji === emoji) &&
+      (data.reactionSummary[emoji] ?? 0) > 0,
+  );
+  const reactions = [
+    ...DEFAULT_REACTION_EMOJIS.map((reaction) => ({
+      emoji: reaction.emoji,
+      label: t(reaction.translationKey),
+    })),
+    ...extraEmojis.map((emoji) => ({ emoji, label: emoji })),
+  ];
+  const isAtLimit = data.userReactions.length >= MAX_USER_REACTIONS;
+
   return (
-    <div className={`flex flex-wrap gap-2 ${compact ? "text-xs" : "text-sm"}`}>
-      {REACTION_TYPES.map((reaction) => {
-        const count = data.reactionSummary[reaction.type] ?? 0;
-        const isActive = data.userReaction === reaction.type;
-        const label = t(getReactionTranslationKey(reaction.type));
+    <div className={`flex flex-wrap items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
+      {reactions.map((reaction) => {
+        const count = data.reactionSummary[reaction.emoji] ?? 0;
+        const isActive = data.userReactions.includes(reaction.emoji);
+        const cannotAdd = isAtLimit && !isActive;
 
         return (
           <button
-            key={reaction.type}
+            key={reaction.emoji}
             type="button"
-            disabled={!isAuthenticated || mutation.isPending}
-            onClick={() => handleClick(reaction.type)}
-            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition ${
+            disabled={!isAuthenticated || mutation.isPending || cannotAdd}
+            onClick={() => handleClick(reaction.emoji)}
+            className={`inline-flex h-8 items-center gap-1 rounded-full border px-2.5 transition ${
               isActive
-                ? "border-orange-600 bg-orange-50 text-orange-900"
-                : "border-stone-200 bg-white text-stone-600 hover:border-orange-300"
+                ? "border-orange-600 bg-orange-50 text-orange-900 dark:border-orange-500 dark:bg-orange-950 dark:text-orange-100"
+                : "border-stone-200 bg-white text-stone-600 hover:border-orange-300 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-orange-700"
             } disabled:cursor-not-allowed disabled:opacity-60`}
-            title={label}
+            title={cannotAdd ? t("engagement.reactionLimit") : reaction.label}
+            aria-pressed={isActive}
           >
             <span>{reaction.emoji}</span>
             {count > 0 ? <span>{count}</span> : null}
           </button>
         );
       })}
+      <ReactionEmojiPicker
+        disabled={!isAuthenticated || mutation.isPending || isAtLimit}
+        onPick={handleClick}
+      />
+      {mutation.isError ? (
+        <span role="alert" className="text-xs text-red-600 dark:text-red-400">
+          {t("engagement.reactionUpdateError")}
+        </span>
+      ) : null}
+      {isAuthenticated && isAtLimit ? (
+        <span className={`text-xs ${themeClasses.muted}`}>{t("engagement.reactionLimit")}</span>
+      ) : null}
       {!isAuthenticated ? (
-        <Link to={ROUTES.login} className="self-center text-xs text-stone-500 hover:text-orange-800">
+        <Link to={ROUTES.login} className={`self-center text-xs ${themeClasses.linkSubtle}`}>
           {t("engagement.logInToReact")}
         </Link>
       ) : null}
diff --git a/frontend/src/features/reactions/components/ReactionEmojiPicker.tsx b/frontend/src/features/reactions/components/ReactionEmojiPicker.tsx
new file mode 100644
index 0000000..070990e
--- /dev/null
+++ b/frontend/src/features/reactions/components/ReactionEmojiPicker.tsx
@@ -0,0 +1,150 @@
+import { useEffect, useRef, useState, type FormEvent } from "react";
+import { useTranslation } from "react-i18next";
+import { EMOTION_EMOJI_OPTIONS } from "../../../lib/emotionEmoji";
+import { themeClasses } from "../../../lib/themeClasses";
+import { DEFAULT_REACTION_EMOJIS } from "../../../types/engagement";
+
+interface ReactionEmojiPickerProps {
+  disabled: boolean;
+  onPick: (emoji: string) => void;
+}
+
+const PICKER_EMOJIS = [
+  ...DEFAULT_REACTION_EMOJIS.map(({ emoji }) => emoji),
+  ...EMOTION_EMOJI_OPTIONS,
+].filter((emoji, index, emojis) => emojis.indexOf(emoji) === index);
+
+function isValidReactionEmoji(value: string): boolean {
+  const emoji = value.trim();
+  if (!emoji || emoji.length > 8) return false;
+  if (/^[a-zA-Z0-9_\-\s./:]+$/.test(emoji)) return false;
+  return [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(emoji)].length === 1;
+}
+
+export function ReactionEmojiPicker({ disabled, onPick }: ReactionEmojiPickerProps) {
+  const { t } = useTranslation();
+  const [isOpen, setIsOpen] = useState(false);
+  const [customEmoji, setCustomEmoji] = useState("");
+  const [validationError, setValidationError] = useState("");
+  const pickerRef = useRef<HTMLDivElement>(null);
+  const triggerRef = useRef<HTMLButtonElement>(null);
+
+  const closePicker = () => {
+    setIsOpen(false);
+    setValidationError("");
+    triggerRef.current?.focus();
+  };
+
+  useEffect(() => {
+    if (!isOpen) return;
+
+    const handleKeyDown = (event: KeyboardEvent) => {
+      if (event.key === "Escape") closePicker();
+    };
+    const handlePointerDown = (event: PointerEvent) => {
+      if (!pickerRef.current?.contains(event.target as Node)) closePicker();
+    };
+
+    document.addEventListener("keydown", handleKeyDown);
+    document.addEventListener("pointerdown", handlePointerDown);
+    return () => {
+      document.removeEventListener("keydown", handleKeyDown);
+      document.removeEventListener("pointerdown", handlePointerDown);
+    };
+  }, [isOpen]);
+
+  const pickEmoji = (emoji: string) => {
+    onPick(emoji);
+    setCustomEmoji("");
+    closePicker();
+  };
+
+  const submitCustomEmoji = (event: FormEvent<HTMLFormElement>) => {
+    event.preventDefault();
+    const emoji = customEmoji.trim();
+    if (!isValidReactionEmoji(emoji)) {
+      setValidationError(t("engagement.reactionInvalid"));
+      return;
+    }
+    pickEmoji(emoji);
+  };
+
+  return (
+    <div ref={pickerRef} className="relative">
+      <button
+        ref={triggerRef}
+        type="button"
+        disabled={disabled}
+        onClick={() => {
+          if (isOpen) {
+            closePicker();
+          } else {
+            setIsOpen(true);
+          }
+        }}
+        aria-label={t("engagement.addReaction")}
+        aria-expanded={isOpen}
+        className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-stone-200 bg-white px-2 text-stone-600 transition hover:border-orange-300 hover:text-orange-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-orange-700 dark:hover:text-orange-300"
+      >
+        +
+      </button>
+
+      {isOpen ? (
+        <div
+          role="dialog"
+          aria-label={t("engagement.addReaction")}
+          className={`absolute bottom-full left-0 z-20 mb-2 w-64 p-3 shadow-lg ${themeClasses.card}`}
+        >
+          <div className="grid grid-cols-7 gap-1">
+            {PICKER_EMOJIS.map((emoji) => (
+              <button
+                key={emoji}
+                type="button"
+                onClick={() => pickEmoji(emoji)}
+                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:hover:bg-stone-800"
+              >
+                <span aria-hidden="true">{emoji}</span>
+                <span className="sr-only">{emoji}</span>
+              </button>
+            ))}
+          </div>
+          <form onSubmit={submitCustomEmoji} className="mt-3 flex gap-2">
+            <label className="min-w-0 flex-1">
+              <span className="sr-only">{t("submissions.emojiCustom")}</span>
+              <input
+                type="text"
+                value={customEmoji}
+                onChange={(event) => {
+                  setCustomEmoji(event.target.value);
+                  setValidationError("");
+                }}
+                maxLength={8}
+                placeholder="=ƒÖé"
+                aria-label={t("submissions.emojiCustom")}
+                aria-describedby={validationError ? "reaction-emoji-error" : undefined}
+                aria-invalid={Boolean(validationError)}
+                className={`${themeClasses.input} py-1 text-center text-lg`}
+              />
+            </label>
+            <button
+              type="submit"
+              disabled={!customEmoji.trim()}
+              className="rounded-lg bg-orange-700 px-3 text-sm font-medium text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-orange-600 dark:hover:bg-orange-500"
+            >
+              {t("engagement.addReaction")}
+            </button>
+          </form>
+          {validationError ? (
+            <p
+              id="reaction-emoji-error"
+              role="alert"
+              className="mt-2 text-xs text-red-600 dark:text-red-400"
+            >
+              {validationError}
+            </p>
+          ) : null}
+        </div>
+      ) : null}
+    </div>
+  );
+}
diff --git a/frontend/src/locales/en/translation.json b/frontend/src/locales/en/translation.json
index 627b825..3cce3f0 100644
--- a/frontend/src/locales/en/translation.json
+++ b/frontend/src/locales/en/translation.json
@@ -267,6 +267,10 @@
       "other": "Other"
     },
     "logInToReact": "Log in to react",
+    "reactionLimit": "You can add up to 7 reactions",
+    "addReaction": "Add reaction",
+    "reactionInvalid": "Enter one emoji (up to 8 characters)",
+    "reactionUpdateError": "Could not update reaction",
     "reportModal": {
       "title": "Report content",
       "description": "Help keep the community safe. Reports are anonymous.",
diff --git a/frontend/src/locales/th/translation.json b/frontend/src/locales/th/translation.json
index 3452aa1..a818bb0 100644
--- a/frontend/src/locales/th/translation.json
+++ b/frontend/src/locales/th/translation.json
@@ -267,6 +267,10 @@
       "other": "a+¡a++a¦êa+Öa¦å"
     },
     "logInToReact": "a¦Ça+éa¦ëa+¦a+¬a+¦a¦êa+úa+¦a+Üa+Üa¦Ça+Pa++a¦êa+¡a¦üa+¬a+öa+ça+¢a+Åa+¦a+üa+¦a+úa+¦a+óa+¦",
+    "reactionLimit": "a+äa++a+ôa¦Ça+Pa+¦a¦êa+ía+¢a+Åa+¦a+üa+¦a+úa+¦a+óa+¦a¦äa+öa¦ëa+¬a+¦a+ça+¬a++a+ö 7 a+úa+¦a+óa+üa+¦a+ú",
+    "addReaction": "a¦Ça+Pa+¦a¦êa+ía+¢a+Åa+¦a+üa+¦a+úa+¦a+óa+¦",
+    "reactionInvalid": "a+üa+úa+¡a+üa+¡a+¦a¦éa+ía+êa+¦ 1 a+òa+¦a+º (a¦äa+ía¦êa¦Ça+üa+¦a+Ö 8 a+¡a+¦a+üa+éa+úa+¦)",
+    "reactionUpdateError": "a+¡a+¦a+¢a¦Ça+öa+òa+¢a+Åa+¦a+üa+¦a+úa+¦a+óa+¦a¦äa+ía¦êa+¬a+¦a¦Ça+úa¦ça+ê",
     "reportModal": {
       "title": "a+úa+¦a+óa+ça+¦a+Öa¦Ça+Öa++a¦ëa+¡a+½a+¦",
       "description": "a+èa¦êa+ºa+óa+úa+¦a+üa+¬a+¦a+äa+ºa+¦a+ía+¢a+Ña+¡a+öa+áa+¦a+óa+éa+¡a+ça+èa++a+ía+èa+Ö a+üa+¦a+úa+úa+¦a+óa+ça+¦a+Öa¦Ça+¢a¦ça+Öa¦üa+Üa+Üa¦äa+ía¦êa¦Ça+¢a+¦a+öa¦Ça+£a+óa+òa+¦a+ºa+òa+Ö",
diff --git a/frontend/src/services/reactionService.ts b/frontend/src/services/reactionService.ts
index 05a1753..7d1e665 100644
--- a/frontend/src/services/reactionService.ts
+++ b/frontend/src/services/reactionService.ts
@@ -1,5 +1,17 @@
 import { apiClient } from "./apiClient";
-import type { ReactionType, ReactionView } from "../types/engagement";
+import type { ReactionView } from "../types/engagement";
+
+function normalizeReactionView(
+  data: Pick<ReactionView, "targetType" | "targetId" | "reactionSummary"> &
+    Partial<Pick<ReactionView, "userReactions">>,
+): ReactionView {
+  return {
+    targetType: data.targetType,
+    targetId: data.targetId,
+    reactionSummary: data.reactionSummary,
+    userReactions: data.userReactions ?? [],
+  };
+}
 
 export async function fetchReactions(
   targetType: "mood" | "comment",
@@ -8,40 +20,29 @@ export async function fetchReactions(
   const response = await apiClient.get<{ success: true; data: ReactionView }>("/reactions", {
     params: { targetType, targetId },
   });
-  return response.data.data;
+  return normalizeReactionView(response.data.data);
 }
 
-export async function upsertReaction(
+export async function toggleReaction(
   targetType: "mood" | "comment",
   targetId: string,
-  reactionType: ReactionType,
+  emoji: string,
 ): Promise<ReactionView> {
-  const response = await apiClient.put<{ success: true; data: ReactionView & { reactionType: ReactionType } }>(
-    "/reactions",
-    { targetType, targetId, reactionType },
-  );
-
-  return {
-    targetType: response.data.data.targetType,
-    targetId: response.data.data.targetId,
-    reactionSummary: response.data.data.reactionSummary,
-    userReaction: response.data.data.reactionType,
-  };
+  const response = await apiClient.put<{ success: true; data: ReactionView }>("/reactions", {
+    targetType,
+    targetId,
+    emoji,
+  });
+  return normalizeReactionView(response.data.data);
 }
 
 export async function removeReaction(
   targetType: "mood" | "comment",
   targetId: string,
+  emoji: string,
 ): Promise<ReactionView> {
-  const response = await apiClient.delete<{ success: true; data: { reactionSummary: Record<string, number> } }>(
-    "/reactions",
-    { data: { targetType, targetId } },
-  );
-
-  return {
-    targetType,
-    targetId,
-    reactionSummary: response.data.data.reactionSummary,
-    userReaction: null,
-  };
+  const response = await apiClient.delete<{ success: true; data: ReactionView }>("/reactions", {
+    data: { targetType, targetId, emoji },
+  });
+  return normalizeReactionView(response.data.data);
 }
diff --git a/frontend/src/types/engagement.ts b/frontend/src/types/engagement.ts
index 0eadbe5..6de9e01 100644
--- a/frontend/src/types/engagement.ts
+++ b/frontend/src/types/engagement.ts
@@ -1,12 +1,10 @@
-export const REACTION_TYPES = [
-  { type: "empathy", emoji: "=ƒÆÖ" },
-  { type: "support", emoji: "=ƒñ¥" },
-  { type: "relate", emoji: "=ƒ½é" },
-  { type: "solidarity", emoji: "G£è" },
+export const DEFAULT_REACTION_EMOJIS = [
+  { emoji: "=ƒÆÖ", translationKey: "engagement.reactions.empathy" },
+  { emoji: "=ƒñ¥", translationKey: "engagement.reactions.support" },
+  { emoji: "=ƒ½é", translationKey: "engagement.reactions.relate" },
+  { emoji: "G£è", translationKey: "engagement.reactions.solidarity" },
 ] as const;
 
-export type ReactionType = (typeof REACTION_TYPES)[number]["type"];
-
 export const REPORT_REASONS = [
   { code: "harassment" },
   { code: "spam" },
@@ -17,10 +15,6 @@ export const REPORT_REASONS = [
 
 export type ReportReasonCode = (typeof REPORT_REASONS)[number]["code"];
 
-export function getReactionTranslationKey(type: ReactionType): string {
-  return `engagement.reactions.${type}`;
-}
-
 export function getReportReasonTranslationKey(code: ReportReasonCode): string {
   return `engagement.reportReasons.${code}`;
 }
@@ -48,5 +42,5 @@ export interface ReactionView {
   targetType: "mood" | "comment";
   targetId: string;
   reactionSummary: Record<string, number>;
-  userReaction: ReactionType | null;
+  userReactions: string[];
 }
