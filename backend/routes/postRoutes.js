const express = require("express");
const { createPost } = require("../controllers/postController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, allowRoles("civilian"), createPost);

module.exports = router;