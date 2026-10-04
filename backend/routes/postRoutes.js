const express = require("express");
const { createPost } = require("../controllers/postController");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const { readPostImage } = require("../middleware/upload");

const router = express.Router();

router.post("/", protect, allowRoles("civilian"), readPostImage, createPost);//readPost means multer read and write in req.file.buffer

module.exports = router;