import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import { REPORT_REASON_CODES } from "../../../domain/constants/engagementConstants.js";

const reportSchema = new Schema(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, required: true, enum: ["mood", "comment"] },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reasonCode: { type: String, required: true, enum: REPORT_REASON_CODES },
    description: { type: String, default: null, maxlength: 1000 },
    status: {
      type: String,
      required: true,
      default: "pending",
      enum: ["pending", "resolved_removed", "resolved_dismissed", "resolved_warned"],
    },
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    resolutionNote: { type: String, default: null },
  },
  { timestamps: true, collection: "reports" },
);

reportSchema.index({ status: 1, createdAt: 1 });
reportSchema.index({ reporterId: 1, targetType: 1, targetId: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });

export type ReportDocument = InferSchemaType<typeof reportSchema> & {
  reporterId: Types.ObjectId;
  targetId: Types.ObjectId;
};

export const ReportModel = model("Report", reportSchema);
