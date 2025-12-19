import mongoose from "mongoose"

const sessionSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scheduledStart: { type: Date, required: true },
    scheduledEnd: { type: Date, required: true },
    actualStart: { type: Date },
    actualEnd: { type: Date },
    plannedDuration: { type: Number, required: true }, // in minutes
    actualDuration: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "missed", "rescheduled"],
      default: "scheduled",
    },
    notes: {
      type: String,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
sessionSchema.index({ user: 1, scheduledStart: 1 })
sessionSchema.index({ plan: 1, scheduledStart: 1 })

export default mongoose.model("Session", sessionSchema)
