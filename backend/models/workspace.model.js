import mongoose from "mongoose"
import { WORKSPACE_ROLES } from "../config/constants.js"

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: Object.values(WORKSPACE_ROLES),
      default: WORKSPACE_ROLES.MEMBER,
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Workspace name is required"],
      trim: true,
      maxlength: [100, "Workspace name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [memberSchema],
    color: {
      type: String,
      default: "#10B981",
    },
    icon: {
      type: String,
      default: "folder",
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Virtual for plans count
workspaceSchema.virtual("plansCount", {
  ref: "Plan",
  localField: "_id",
  foreignField: "workspace",
  count: true,
})

// Soft delete
workspaceSchema.methods.softDelete = async function () {
  this.isDeleted = true
  this.deletedAt = new Date()
  await this.save()
}

export default mongoose.model("Workspace", workspaceSchema)
