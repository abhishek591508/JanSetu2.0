const express = require("express");
const { createPost,  getNearbyPosts} = require("../controllers/postController");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const { readPostImage } = require("../middleware/upload");

const router = express.Router();


// POST /api/posts
router.post(
  "/",
  protect,
  allowRoles("civilian"),
  readPostImage,//readPost means multer read and write in req.file.buffer
  createPost
);

// GET /api/posts/nearby
router.get(
  "/nearby",
  protect,
  allowRoles("civilian"),
  getNearbyPosts
);

module.exports = router;