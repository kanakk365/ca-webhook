import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITerraUser extends Document {
  terra_user_id: string;
  reference_id: string;
  provider: string;
  scopes: string;
  active: boolean;
  connected_at: Date;
  updated_at: Date;
}

const TerraUserSchema = new Schema<ITerraUser>(
  {
    terra_user_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reference_id: {
      type: String,
      index: true,
    },
    provider: {
      type: String,
      required: true,
    },
    scopes: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    },
    connected_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // we manage updated_at manually
  },
);

// Avoid model recompilation in Next.js dev (hot reload)
export const TerraUser: Model<ITerraUser> =
  mongoose.models.TerraUser ||
  mongoose.model<ITerraUser>("TerraUser", TerraUserSchema);
