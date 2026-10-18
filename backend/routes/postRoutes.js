const express = require("express");
const { createPost, getNearbyPosts, upvotePost, getSimilarPosts, getPost } = require("../controllers/postController");
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

// GET /api/posts/similar?latitude=&longitude=&category=
router.get(
  "/similar",
  protect,
  allowRoles("civilian"),
  getSimilarPosts
);

// GET /api/posts/:postId
router.get(
  "/:postId",
  protect,
  allowRoles("civilian"),
  getPost
);

// POST /api/posts/:postId/upvote
router.post(
  "/:postId/upvote",
  protect,
  allowRoles("civilian"),
  upvotePost
);

module.exports = router;