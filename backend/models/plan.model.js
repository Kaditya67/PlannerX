import mongoose from "mongoose"
import { PLAN_TYPES } from "../config/constants.js"

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
      maxlength: [200, "Plan name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },
    type: {
      type: String,
      enum: Object.values(PLAN_TYPES),
      required: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collaborationType: {
      type: String,
      enum: ["solo", "group"],
      default: "solo",
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    startDate: { type: Date },
    endDate: { type: Date },
    deadline: { type: Date },
    totalDuration: { type: Number, default: 0 }, // in minutes
    completedDuration: { type: Number, default: 0 },
    color: { type: String, default: "#3B82F6" },
    icon: { type: String, default: "clipboard" },
    metadata: {
      hasStages: { type: Boolean, default: true },
      autoGenerateSessions: { type: Boolean, default: false },
      sessionDuration: { type: Number, default: 60 }, // in minutes
    },
    status: {
      type: String,
      enum: ["active", "archived", "stashed"],
      default: "active",
    },
    tags: [{ type: String, trim: true }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Virtual for sections
planSchema.virtual("sections", {
  ref: "Section",
  localField: "_id",
  foreignField: "plan",
})

// Calculate progress percentage
planSchema.virtual("progress").get(function () {
  if (this.totalDuration === 0) return 0
  return Math.round((this.completedDuration / this.totalDuration) * 100)
})

// Soft delete
planSchema.methods.softDelete = async function () {
  this.isDeleted = true
  this.deletedAt = new Date()
  await this.save()
}

export default mongoose.model("Plan", planSchema)
