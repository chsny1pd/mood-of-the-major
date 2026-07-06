import type {
  DailyStatistics,
  UpsertDailyStatisticsInput,
} from "../../../domain/entities/DailyStatistics.js";
import type {
  DailyStatisticsQuery,
  IDailyStatisticsRepository,
} from "../../../domain/ports/IDailyStatisticsRepository.js";
import type { StatisticsScopeType } from "../../../domain/constants/statisticsConstants.js";
import { DailyStatisticsModel } from "../models/DailyStatistics.js";

function toEntity(doc: {
  _id: { toString(): string };
  date: Date;
  scopeType: DailyStatistics["scopeType"];
  scopeId?: { toString(): string } | null;
  tagId?: { toString(): string } | null;
  moodCount: number;
  commentCount: number;
  reactionCount: number;
  activeMoodCount: number;
  uniqueParticipantCount?: number | null;
  meetsThreshold: boolean;
  algorithmVersion: string;
  calculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}): DailyStatistics {
  return {
    id: doc._id.toString(),
    date: doc.date,
    scopeType: doc.scopeType,
    scopeId: doc.scopeId?.toString() ?? null,
    tagId: doc.tagId?.toString() ?? null,
    moodCount: doc.moodCount,
    commentCount: doc.commentCount,
    reactionCount: doc.reactionCount,
    activeMoodCount: doc.activeMoodCount,
    uniqueParticipantCount: doc.uniqueParticipantCount ?? null,
    meetsThreshold: doc.meetsThreshold,
    algorithmVersion: doc.algorithmVersion,
    calculatedAt: doc.calculatedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongooseDailyStatisticsRepository implements IDailyStatisticsRepository {
  async upsert(input: UpsertDailyStatisticsInput): Promise<DailyStatistics> {
    const doc = await DailyStatisticsModel.findOneAndUpdate(
      {
        date: input.date,
        scopeType: input.scopeType,
        scopeId: input.scopeId ?? null,
        tagId: input.tagId ?? null,
        algorithmVersion: input.algorithmVersion,
      },
      {
        $set: {
          moodCount: input.moodCount,
          commentCount: input.commentCount,
          reactionCount: input.reactionCount,
          activeMoodCount: input.activeMoodCount,
          uniqueParticipantCount: input.uniqueParticipantCount,
          meetsThreshold: input.meetsThreshold,
          calculatedAt: input.calculatedAt,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    return toEntity(doc);
  }

  async findByScopeAndDateRange(query: DailyStatisticsQuery): Promise<DailyStatistics[]> {
    const filter: Record<string, unknown> = {
      scopeType: query.scopeType,
      date: { $gte: query.from, $lte: query.to },
      algorithmVersion: query.algorithmVersion ?? "v1",
    };

    if (query.scopeId) {
      filter.scopeId = query.scopeId;
    } else {
      filter.scopeId = null;
    }

    if (query.tagId !== undefined) {
      filter.tagId = query.tagId;
    }

    const docs = await DailyStatisticsModel.find(filter).sort({ date: 1 }).lean();
    return docs.map(toEntity);
  }

  async sumByTagInWindow(input: {
    scopeType: StatisticsScopeType;
    scopeId: string | null;
    from: Date;
    to: Date;
    algorithmVersion?: string;
  }): Promise<Array<{ tagId: string | null; moodCount: number; commentCount: number; reactionCount: number }>> {
    const match: Record<string, unknown> = {
      scopeType: input.scopeType,
      date: { $gte: input.from, $lte: input.to },
      algorithmVersion: input.algorithmVersion ?? "v1",
      tagId: { $ne: null },
    };

    if (input.scopeId) {
      match.scopeId = input.scopeId;
    } else {
      match.scopeId = null;
    }

    const rows = await DailyStatisticsModel.aggregate<{
      _id: { toString(): string } | null;
      moodCount: number;
      commentCount: number;
      reactionCount: number;
    }>([
      { $match: match },
      {
        $group: {
          _id: "$tagId",
          moodCount: { $sum: "$moodCount" },
          commentCount: { $sum: "$commentCount" },
          reactionCount: { $sum: "$reactionCount" },
        },
      },
    ]);

    return rows.map((row) => ({
      tagId: row._id?.toString() ?? null,
      moodCount: row.moodCount,
      commentCount: row.commentCount,
      reactionCount: row.reactionCount,
    }));
  }
}
