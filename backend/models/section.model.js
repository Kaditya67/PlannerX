import mongoose from "mongoose"

const sectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Section name is required"],
      trim: true,
      maxlength: [200, "Section name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    parentSection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },
    color: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    totalDuration: { type: Number, default: 0 },
    completedDuration: { type: Number, default: 0 },
    isCollapsed: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Virtual for items
sectionSchema.virtual("items", {
  ref: "Item",
  localField: "_id",
  foreignField: "section",
})

// Virtual for child sections
sectionSchema.virtual("children", {
  ref: "Section",
  localField: "_id",
  foreignField: "parentSection",
})

// Virtual for progress
sectionSchema.virtual("progress").get(function () {
  if (this.totalDuration === 0) return 0
  return Math.round((this.completedDuration / this.totalDuration) * 100)
})

export default mongoose.model("Section", sectionSchema)
