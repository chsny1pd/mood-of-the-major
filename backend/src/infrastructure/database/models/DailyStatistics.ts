import { Schema, model, type InferSchemaType } from "mongoose";

const dailyStatisticsSchema = new Schema(
  {
    date: { type: Date, required: true },
    scopeType: {
      type: String,
      required: true,
      enum: ["platform", "faculty", "major"],
    },
    scopeId: { type: Schema.Types.ObjectId, default: null },
    tagId: { type: Schema.Types.ObjectId, default: null, ref: "Tag" },
    moodCount: { type: Number, required: true, default: 0, min: 0 },
    commentCount: { type: Number, required: true, default: 0, min: 0 },
    reactionCount: { type: Number, required: true, default: 0, min: 0 },
    activeMoodCount: { type: Number, required: true, default: 0, min: 0 },
    uniqueParticipantCount: { type: Number, default: null, min: 0 },
    meetsThreshold: { type: Boolean, required: true, default: false },
    algorithmVersion: { type: String, required: true, default: "v1" },
    calculatedAt: { type: Date, required: true },
  },
  { timestamps: true, collection: "dailystatistics" },
);

dailyStatisticsSchema.index(
  { date: 1, scopeType: 1, scopeId: 1, tagId: 1, algorithmVersion: 1 },
  { unique: true },
);
dailyStatisticsSchema.index({ scopeType: 1, scopeId: 1, date: -1 });
dailyStatisticsSchema.index({ scopeType: 1, scopeId: 1, tagId: 1, date: -1 });
dailyStatisticsSchema.index({ calculatedAt: 1 });

export type DailyStatisticsDocument = InferSchemaType<typeof dailyStatisticsSchema>;
export const DailyStatisticsModel = model("DailyStatistics", dailyStatisticsSchema);
