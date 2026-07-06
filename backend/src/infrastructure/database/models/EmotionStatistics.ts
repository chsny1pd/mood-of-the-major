import { Schema, model, type InferSchemaType } from "mongoose";

const emotionStatisticsSchema = new Schema(
  {
    scopeType: {
      type: String,
      required: true,
      enum: ["platform", "faculty", "major"],
    },
    scopeId: { type: Schema.Types.ObjectId, default: null },
    tagId: { type: Schema.Types.ObjectId, required: true, ref: "Tag" },
    periodType: {
      type: String,
      required: true,
      enum: ["all_time", "rolling_7d", "rolling_30d", "rolling_90d"],
    },
    moodCount: { type: Number, required: true, default: 0, min: 0 },
    percentage: { type: Number, default: null, min: 0, max: 100 },
    rank: { type: Number, default: null, min: 1 },
    meetsThreshold: { type: Boolean, required: true, default: false },
    algorithmVersion: { type: String, required: true, default: "v1" },
    calculatedAt: { type: Date, required: true },
  },
  { timestamps: true, collection: "emotionstatistics" },
);

emotionStatisticsSchema.index(
  { scopeType: 1, scopeId: 1, periodType: 1, tagId: 1, algorithmVersion: 1 },
  { unique: true },
);
emotionStatisticsSchema.index({ scopeType: 1, scopeId: 1, periodType: 1, rank: 1 });
emotionStatisticsSchema.index({ calculatedAt: 1 });

export type EmotionStatisticsDocument = InferSchemaType<typeof emotionStatisticsSchema>;
export const EmotionStatisticsModel = model("EmotionStatistics", emotionStatisticsSchema);
