import type {
  DailyAggregationRow,
  IStatisticsSourceRepository,
  PeriodTagCount,
} from "../../../domain/ports/IStatisticsSourceRepository.js";
import type { StatisticsScopeType } from "../../../domain/constants/statisticsConstants.js";
import { CommentModel } from "../models/Comment.js";
import { MoodModel } from "../models/Mood.js";
import { ReactionModel } from "../models/Reaction.js";

function utcDayStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addScopeRows(
  map: Map<string, DailyAggregationRow>,
  date: Date,
  scopeType: StatisticsScopeType,
  scopeId: string | null,
  tagId: string | null,
  patch: Partial<DailyAggregationRow>,
): void {
  const key = `${date.toISOString()}|${scopeType}|${scopeId ?? ""}|${tagId ?? ""}`;
  const existing = map.get(key) ?? {
    date,
    scopeType,
    scopeId,
    tagId,
    moodCount: 0,
    commentCount: 0,
    reactionCount: 0,
    activeMoodCount: 0,
    uniqueParticipantCount: 0,
  };

  map.set(key, {
    ...existing,
    moodCount: existing.moodCount + (patch.moodCount ?? 0),
    commentCount: existing.commentCount + (patch.commentCount ?? 0),
    reactionCount: existing.reactionCount + (patch.reactionCount ?? 0),
    activeMoodCount: existing.activeMoodCount + (patch.activeMoodCount ?? 0),
    uniqueParticipantCount: existing.uniqueParticipantCount + (patch.uniqueParticipantCount ?? 0),
  });
}

function addPeriodCount(
  map: Map<string, PeriodTagCount>,
  scopeType: StatisticsScopeType,
  scopeId: string | null,
  tagId: string,
): void {
  const key = `${scopeType}|${scopeId ?? ""}|${tagId}`;
  const existing = map.get(key) ?? { scopeType, scopeId, tagId, moodCount: 0 };
  map.set(key, { ...existing, moodCount: existing.moodCount + 1 });
}

export class MongooseStatisticsSourceRepository implements IStatisticsSourceRepository {
  async aggregateDaily(from: Date, to: Date): Promise<DailyAggregationRow[]> {
    const map = new Map<string, DailyAggregationRow>();

    const moods = await MoodModel.find({
      status: "active",
      deletedAt: null,
      createdAt: { $gte: from, $lte: to },
    })
      .select("_id authorId facultyId majorId primaryTagId createdAt commentCount reactionSummary")
      .lean();

    for (const mood of moods) {
      const day = utcDayStart(mood.createdAt);
      const tagId = mood.primaryTagId?.toString() ?? null;
      const facultyId = mood.facultyId?.toString() ?? null;
      const majorId = mood.majorId?.toString() ?? null;
      const reactionTotal = Object.values(mood.reactionSummary ?? {}).reduce<number>(
        (sum, count) => sum + (typeof count === "number" ? count : 0),
        0,
      );

      const moodPatch = { moodCount: 1, activeMoodCount: 1, uniqueParticipantCount: 1 };

      addScopeRows(map, day, "platform", null, null, moodPatch);
      addScopeRows(map, day, "platform", null, tagId, { moodCount: 1, activeMoodCount: 1 });

      if (facultyId) {
        addScopeRows(map, day, "faculty", facultyId, null, moodPatch);
        addScopeRows(map, day, "faculty", facultyId, tagId, { moodCount: 1, activeMoodCount: 1 });
      }

      if (majorId) {
        addScopeRows(map, day, "major", majorId, null, moodPatch);
        addScopeRows(map, day, "major", majorId, tagId, { moodCount: 1, activeMoodCount: 1 });
      }

      if (mood.commentCount > 0 || reactionTotal > 0) {
        addScopeRows(map, day, "platform", null, null, {
          commentCount: mood.commentCount,
          reactionCount: reactionTotal,
        });
      }
    }

    const comments = await CommentModel.find({
      status: "active",
      deletedAt: null,
      createdAt: { $gte: from, $lte: to },
    })
      .select("moodId createdAt")
      .lean();

    for (const comment of comments) {
      const day = utcDayStart(comment.createdAt);
      addScopeRows(map, day, "platform", null, null, { commentCount: 1, activeMoodCount: 1 });
    }

    const reactions = await ReactionModel.find({
      createdAt: { $gte: from, $lte: to },
    })
      .select("createdAt")
      .lean();

    for (const reaction of reactions) {
      const day = utcDayStart(reaction.createdAt);
      addScopeRows(map, day, "platform", null, null, { reactionCount: 1, activeMoodCount: 1 });
    }

    return [...map.values()];
  }

  async aggregatePeriodTagCounts(from: Date, to: Date): Promise<PeriodTagCount[]> {
    const map = new Map<string, PeriodTagCount>();

    const moods = await MoodModel.find({
      status: "active",
      deletedAt: null,
      createdAt: { $gte: from, $lte: to },
      primaryTagId: { $ne: null },
    })
      .select("facultyId majorId primaryTagId")
      .lean();

    for (const mood of moods) {
      const tagId = mood.primaryTagId!.toString();
      addPeriodCount(map, "platform", null, tagId);

      const facultyId = mood.facultyId?.toString() ?? null;
      if (facultyId) {
        addPeriodCount(map, "faculty", facultyId, tagId);
      }

      const majorId = mood.majorId?.toString() ?? null;
      if (majorId) {
        addPeriodCount(map, "major", majorId, tagId);
      }
    }

    return [...map.values()];
  }

  async aggregateAllTimeTagCounts(): Promise<PeriodTagCount[]> {
    const map = new Map<string, PeriodTagCount>();

    const moods = await MoodModel.find({
      status: "active",
      deletedAt: null,
      primaryTagId: { $ne: null },
    })
      .select("facultyId majorId primaryTagId")
      .lean();

    for (const mood of moods) {
      const tagId = mood.primaryTagId!.toString();
      addPeriodCount(map, "platform", null, tagId);

      const facultyId = mood.facultyId?.toString() ?? null;
      if (facultyId) {
        addPeriodCount(map, "faculty", facultyId, tagId);
      }

      const majorId = mood.majorId?.toString() ?? null;
      if (majorId) {
        addPeriodCount(map, "major", majorId, tagId);
      }
    }

    return [...map.values()];
  }
}
