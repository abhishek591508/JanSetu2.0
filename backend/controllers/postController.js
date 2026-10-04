const Post = require("../models/Post");
const {CATEGORIES, CATEGORY_DEPARTMENT, RADIUS_TIERS_KM} = require("../constants/posts");
const {cloudinary, uploadPostImage} = require("../config/cloudinary")


function validateCreatePost(body) {
  const errors = [];
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const category = body.category;
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);

  if (description.length < 10 || description.length > 500) {
    errors.push("Description must be between 10 and 500 characters");
  }

  if (!CATEGORIES.includes(category)) {
    errors.push("Category is not valid");
  }

  if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
    errors.push("Latitude is not valid");
  }

  if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
    errors.push("Longitude is not valid");
  }

  return { errors, description, category, latitude, longitude };
}

const   createPost = async (req, res) => {
  let uploadedPublicId = "";

  try {
    const checked = validateCreatePost(req.body);

    if (checked.errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid post",
        errors: checked.errors,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const uploaded = await uploadPostImage(req.file.buffer);
    uploadedPublicId = uploaded.publicId;// there are 2 things, {1: resule.secureUrl and 2: result.publicID}, public id used to manage stored image

    const post = await Post.create({
      description: checked.description,
      category: checked.category,
      department: CATEGORY_DEPARTMENT[checked.category],
      imageUrl: uploaded.url,
      location: {
        type: "Point",
        coordinates: [checked.longitude, checked.latitude],
      },
      createdBy: req.user._id,
      status: "open",
      radiusKm: RADIUS_TIERS_KM[0],
      escalationLevel: "local",
      upvoteCount: 0,
    });

    await post.populate("createdBy", "name role civicScore");

    return res.status(201).json({
      success: true,
      post,
    });
  } catch (error) {
    if (uploadedPublicId) {//uploadedPulicId is used to manage the image : like jansetu/image/abc.jpg
      await cloudinary.uploader.destroy(uploadedPublicId);
    }

    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Could not create post",
    });
  }
};

module.exports = { createPost };