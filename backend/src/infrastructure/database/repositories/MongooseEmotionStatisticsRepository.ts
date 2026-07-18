import { Types } from "mongoose";
import type {
  EmotionStatistics,
  UpsertEmotionStatisticsInput,
} from "../../../domain/entities/EmotionStatistics.js";
import type {
  EmotionStatisticsQuery,
  IEmotionStatisticsRepository,
} from "../../../domain/ports/IEmotionStatisticsRepository.js";
import { EmotionStatisticsModel } from "../models/EmotionStatistics.js";

function toObjectIdOrNull(id: string | null | undefined): Types.ObjectId | null {
  if (!id) {
    return null;
  }
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }
  return new Types.ObjectId(id);
}

function toEntity(doc: {
  _id: { toString(): string };
  scopeType: EmotionStatistics["scopeType"];
  scopeId?: { toString(): string } | null;
  tagId: { toString(): string };
  periodType: EmotionStatistics["periodType"];
  moodCount: number;
  percentage?: number | null;
  rank?: number | null;
  meetsThreshold: boolean;
  algorithmVersion: string;
  calculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}): EmotionStatistics {
  return {
    id: doc._id.toString(),
    scopeType: doc.scopeType,
    scopeId: doc.scopeId?.toString() ?? null,
    tagId: doc.tagId.toString(),
    periodType: doc.periodType,
    moodCount: doc.moodCount,
    percentage: doc.percentage ?? null,
    rank: doc.rank ?? null,
    meetsThreshold: doc.meetsThreshold,
    algorithmVersion: doc.algorithmVersion,
    calculatedAt: doc.calculatedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongooseEmotionStatisticsRepository implements IEmotionStatisticsRepository {
  async upsert(input: UpsertEmotionStatisticsInput): Promise<EmotionStatistics> {
    const doc = await EmotionStatisticsModel.findOneAndUpdate(
      {
        scopeType: input.scopeType,
        scopeId: input.scopeId ?? null,
        tagId: input.tagId,
        periodType: input.periodType,
        algorithmVersion: input.algorithmVersion,
      },
      {
        $set: {
          moodCount: input.moodCount,
          percentage: input.percentage,
          rank: input.rank,
          meetsThreshold: input.meetsThreshold,
          calculatedAt: input.calculatedAt,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    return toEntity(doc);
  }

  async findByScope(query: EmotionStatisticsQuery): Promise<EmotionStatistics[]> {
    const filter: Record<string, unknown> = {
      scopeType: query.scopeType,
      periodType: query.periodType,
      algorithmVersion: query.algorithmVersion ?? "v1",
    };

    if (query.scopeId) {
      filter.scopeId = toObjectIdOrNull(query.scopeId);
    } else {
      filter.scopeId = null;
    }

    const docs = await EmotionStatisticsModel.find(filter).sort({ rank: 1, moodCount: -1 }).lean();
    return docs.map(toEntity);
  }

  async deleteByScope(query: EmotionStatisticsQuery): Promise<void> {
    const filter: Record<string, unknown> = {
      scopeType: query.scopeType,
      periodType: query.periodType,
      algorithmVersion: query.algorithmVersion ?? "v1",
    };

    if (query.scopeId) {
      filter.scopeId = toObjectIdOrNull(query.scopeId);
    } else {
      filter.scopeId = null;
    }

    await EmotionStatisticsModel.deleteMany(filter);
  }
}
