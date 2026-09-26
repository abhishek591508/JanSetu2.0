const Post = require("../models/Post");
const {
  CATEGORIES,
  CATEGORY_DEPARTMENT,
  RADIUS_TIERS_KM,
} = require("../constants/posts");

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

const createPost = async (req, res) => {
  try {
    const checked = validateCreatePost(req.body);

    if (checked.errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid post",
        errors: checked.errors,
      });
    }

    const post = await Post.create({
      description: checked.description,
      category: checked.category,
      department: CATEGORY_DEPARTMENT[checked.category],
      imageUrl: "",
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

    await post.populate("createdBy", "name role civicScore");//populate is used to populate the createdBy field with the name, role and civicScore fields and return with res

    return res.status(201).json({
      success: true,
      post,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Could not create post",
    });
  }
};

module.exports = { createPost };