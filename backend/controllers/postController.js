const Post = require("../models/Post");
const {CATEGORIES, CATEGORY_DEPARTMENT, RADIUS_TIERS_KM} = require("../constants/posts");
const {cloudinary, uploadPostImage} = require("../config/cloudinary")
const mongoose = require("mongoose");


//a reusable function to check if the postData is correct or not
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

//Controller 1 for creating a post
const createPost = async (req, res) => {
  let uploadedPublicId = "";

  try {
    const checked = validateCreatePost(req.body);
    console.log("Reached 1");

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
    console.log("Reached 2");

    const uploaded = await uploadPostImage(req.file.buffer);
    uploadedPublicId = uploaded.publicId;// there are 2 things, {1: resule.secureUrl and 2: result.publicID}, public id used to manage stored image
    console.log("Reached 3");

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
    console.log("Reached 4");

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

//controller 2 to find the nearby feed using mongoDB's geospatial feature, [post is indexed 2d sphere, search enabled]
const getNearbyPosts = async (req, res) => {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);

    // Validate the user's coordinates
    if (
      req.query.latitude === undefined ||
      req.query.longitude === undefined ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required",
      });
    }

    // Find posts within 5 km, nearest first
    const posts = await Post.aggregate([//.aggregate() lets you perform multiple data-processing operations through a pipeline.
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          key: "location",
          distanceField: "distanceMeters",
          maxDistance: 5000,
          spherical: true,
        },
      },
      {
        $limit: 100,
      },
    ]);

    // Populate the creator details after aggregation
    await Post.populate(posts, {
      path: "createdBy",
      select: "name role civicScore",
    });

    return res.status(200).json({
      success: true,
      count: posts.length,
      radiusKm: 5,
      posts,
    });
  } catch (error) {
    console.error("Get nearby posts error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not fetch nearby posts",
    });
  }
};


//controller for upvote by users

// POST /api/posts/:postId/upvote
const upvotePost = async (req, res) => {
  try {
    const { postId } = req.params;

    // console.log("Reached upvoteController 1")
    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }
    // console.log("Reached upvoteController 2")
    // One atomic update: add this user and increment once.
    // A resolved post cannot receive new votes.
    const post = await Post.findOneAndUpdate(
      {
        _id: postId,
        status: { $ne: "resolved" },
        upvotedBy: { $ne: req.user._id },
      },
      {
        $addToSet: { upvotedBy: req.user._id },
        $inc: { upvoteCount: 1 },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("_id upvoteCount status");

    if (post) {
      return res.status(200).json({
        success: true,
        message: "Issue upvoted successfully",
        upvoteCount: post.upvoteCount,
        hasUpvoted: true,
      });
    }

    // Determine why the atomic update did not match.
    const existingPost = await Post.findById(postId)
      .select("status upvoteCount upvotedBy");

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (existingPost.status === "resolved") {
      return res.status(400).json({
        success: false,
        message: "Resolved issues cannot be upvoted",
      });
    }

    return res.status(409).json({
      success: false,
      message: "You have already upvoted this issue",
      upvoteCount: existingPost.upvoteCount,
      hasUpvoted: true,
    });
  } catch (error) {
    console.error("Upvote post error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not upvote this issue",
    });
  }
};


//get similar post nearBy
const getSimilarPosts = async (req, res) => {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    const category = req.query.category;

    if (
      req.query.latitude === undefined ||
      req.query.longitude === undefined ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180 ||
      !CATEGORIES.includes(category)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid coordinates and category are required",
      });
    }

    const posts = await Post.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          key: "location",
          distanceField: "distanceMeters",
          maxDistance: 100, // 100 metres
          spherical: true,
          query: {
            category,
            status: { $ne: "resolved" },
          },
        },
      },
      { $limit: 3 },
    ]);

    await Post.populate(posts, {
      path: "createdBy",
      select: "name",
    });

    return res.status(200).json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (error) {
    console.error("Similar posts error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not find similar issues",
    });
  }
};


const getPost = async (req, res) => {
  try {
    const postId = req.params.postId;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    const post = await Post.findById(postId).populate("createdBy", "name role civicScore");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    return res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    console.error("Get post error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not fetch post",
    });
  }
};

module.exports = { createPost, getNearbyPosts, upvotePost, getSimilarPosts, getPost };