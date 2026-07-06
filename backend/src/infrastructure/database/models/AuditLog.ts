import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import { AUDIT_ACTIONS } from "../../../domain/constants/adminConstants.js";

const auditLogSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true, enum: AUDIT_ACTIONS },
    targetType: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    identityAccessed: { type: Boolean, required: true, default: false },
    ipAddress: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "auditlogs" },
);

auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ identityAccessed: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema> & {
  adminId: Types.ObjectId;
  targetId: Types.ObjectId | null;
};

export const AuditLogModel = model("AuditLog", auditLogSchema);
