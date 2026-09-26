const express = require("express");
const { signup, login, tryController, authorityOnly, getMe} = require("../controllers/authController");
const {protect, allowRoles} = require("../middleware/authMiddleware")

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/try", protect, tryController);
router.get("/authorityOnly", protect, allowRoles("admin", "authority", "civilian"), authorityOnly);
router.get("/me", protect, getMe);

module.exports = router;