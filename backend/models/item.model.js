import mongoose from "mongoose"
import { ITEM_STATUS, ITEM_PRIORITY, TIME_FLEXIBILITY } from "../config/constants.js"

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Item title is required"],
      trim: true,
      maxlength: [300, "Title cannot exceed 300 characters"],
    },
    description: {
      type: String,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      default: "",
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      default: null,
    },
    parentItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(ITEM_STATUS),
      default: ITEM_STATUS.TODO,
    },
    priority: {
      type: String,
      enum: Object.values(ITEM_PRIORITY),
      default: ITEM_PRIORITY.MEDIUM,
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    order: { type: Number, default: 0 },
    plannedDuration: { type: Number, default: 0 }, // in minutes
    actualDuration: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    deadline: { type: Date },
    flexibility: {
      type: String,
      enum: Object.values(TIME_FLEXIBILITY),
      default: TIME_FLEXIBILITY.FLEXIBLE,
    },
    dependencies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
      },
    ],
    tags: [{ type: String, trim: true }],
    completedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Virtual for child items
itemSchema.virtual("children", {
  ref: "Item",
  localField: "_id",
  foreignField: "parentItem",
})

// Virtual for sessions
itemSchema.virtual("sessions", {
  ref: "Session",
  localField: "_id",
  foreignField: "item",
})

// Update status hooks
itemSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === ITEM_STATUS.COMPLETED && !this.completedAt) {
    this.completedAt = new Date()
  }
  next()
})

export default mongoose.model("Item", itemSchema)
