const CATEGORIES = ["roads", "lights", "water", "garbage", "safety", "other"];

const CATEGORY_DEPARTMENT = {
  roads: "roads",
  lights: "electricity",
  water: "water",
  garbage: "sanitation",
  safety: "safety",
  other: "general",
};

const POST_STATUS = ["open", "in_progress", "resolved"];
const AUTHORITY_LEVELS = ["local", "district", "higher"];

const RADIUS_TIERS_KM = [1, 5, 10, 20];
const UPVOTE_THRESHOLDS = [10, 25, 40];

module.exports = {
  CATEGORIES,
  CATEGORY_DEPARTMENT,
  POST_STATUS,
  AUTHORITY_LEVELS,
  RADIUS_TIERS_KM,
  UPVOTE_THRESHOLDS,
};