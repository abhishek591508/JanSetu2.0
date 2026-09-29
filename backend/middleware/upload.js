const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.mimetype)) {
      cb(new Error("Only jpg, png and webp images are allowed"));
      return;
    }

    cb(null, true);
  },
});

function readPostImage(req, res, next) {
  upload.single("image")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Image must be under 5 MB",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Could not read the image",
    });
  });
}

module.exports = { readPostImage };