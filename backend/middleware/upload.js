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

function readPostImage(req, res, next) {//upload.single() is callback-based, not something you're awaiting, so not done: const readPost = async(req,res,next)=>{}
  upload.single("image")(req, res, (error) => {//run the multer, read file from formdata whole name starts from "image"
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