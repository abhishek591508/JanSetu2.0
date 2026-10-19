const multer = require("multer");

//configure the multer - create a multer uploader with these following rules
const upload = multer({
  storage: multer.memoryStorage(),//keep the file in RAM, so in future can access (req.file.buffer)
  limits: { fileSize: 5 * 1024 * 1024 },//5MB limit
  fileFilter: (req, file, cb) => {//multer call this funciton when file arrives
    const allowed = ["image/jpeg", "image/png", "image/webp"];//allowed files

    if (!allowed.includes(file.mimetype)) {
      cb(new Error("Only jpg, png and webp images are allowed"));
      return;
    }

    cb(null, true);//accept this file
  },
});//file made available in req.file for controller.


// Rule: Use async only when you need to await a Promise

function readPostImage(req, res, next) {//upload.array() is callback-based, not something you're awaiting
  upload.array("image", 5)(req, res, (error) => {//the field name stays "image"; up to 5 files
    if (!error) {
      next();
      return;
    }

    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Each image must be under 5 MB",
      });
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "You can attach up to 5 images",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Could not read the image",
    });
  });
}

module.exports = { readPostImage };