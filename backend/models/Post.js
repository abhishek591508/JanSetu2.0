const mongoose = require("mongoose");
const {
  CATEGORIES,
  POST_STATUS,
  AUTHORITY_LEVELS,
  RADIUS_TIERS_KM,
} = require("../constants/posts");

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
      default: "Point",
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 500,
    },
    category: {
      type: String,
      required: true,
      enum: CATEGORIES,
    },
    department: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    location: {
      type: pointSchema,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: POST_STATUS,
      default: "open",
    },
    radiusKm: {
      type: Number,
      default: RADIUS_TIERS_KM[0],
      min: 1,
      max: 20,
    },
    upvoteCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    escalationLevel: {
      type: String,
      enum: AUTHORITY_LEVELS,
      default: "local",
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

postSchema.index({ location: "2dsphere" });
postSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);