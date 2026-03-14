import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITerraEvent extends Document {
  terra_user_id: string;
  reference_id: string;
  type: string;
  summary_id: string;
  start_time: Date;
  end_time: Date;
  payload: Record<string, unknown>;
  received_at: Date;
}

const TerraEventSchema = new Schema<ITerraEvent>(
  {
    terra_user_id: {
      type: String,
      required: true,
      index: true,
    },
    reference_id: {
      type: String,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["activity", "daily", "sleep", "body", "nutrition"],
      index: true,
    },
    summary_id: {
      type: String,
      required: true,
      unique: true,
    },
    start_time: {
      type: Date,
    },
    end_time: {
      type: Date,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    received_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  },
);

// Compound index for dashboard queries
TerraEventSchema.index({ reference_id: 1, type: 1, start_time: -1 });

export const TerraEvent: Model<ITerraEvent> =
  mongoose.models.TerraEvent ||
  mongoose.model<ITerraEvent>("TerraEvent", TerraEventSchema);
