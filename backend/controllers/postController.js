const Post = require("../models/Post");
const {CATEGORIES, CATEGORY_DEPARTMENT, RADIUS_TIERS_KM, visibilityForUpvotes} = require("../constants/posts");
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
  const uploadedImages = [];

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

    const files = req.files || [];

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }
    console.log("Reached 2");

    for (const file of files) {
      const uploaded = await uploadPostImage(file.buffer);
      uploadedImages.push(uploaded);
    }
    console.log("Reached 3");

    const imageUrls = uploadedImages.map((item) => item.url);

    const post = await Post.create({
      description: checked.description,
      category: checked.category,
      department: CATEGORY_DEPARTMENT[checked.category],
      imageUrl: imageUrls[0],
      imageUrls,
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
    for (const item of uploadedImages) {
      await cloudinary.uploader.destroy(item.publicId);
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

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // The index finds posts inside the widest tier. Each post is then kept
    // only if the person is inside that post's own radius.
    const posts = await Post.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          key: "location",
          distanceField: "distanceMeters",
          maxDistance: RADIUS_TIERS_KM[3] * 1000,
          spherical: true,
        },
      },
      {
        $match: {
          $expr: {
            $lte: ["$distanceMeters", { $multiply: ["$radiusKm", 1000] }],
          },
        },
      },
      {
        $addFields: {
          upvoteVelocity: {
            $size: {
              $filter: {
                input: { $ifNull: ["$recentUpvoteTimes", []] },
                as: "votedAt",
                cond: { $gte: ["$$votedAt", since] },
              },
            },
          },
        },
      },
      {
        $addFields: {
          rankScore: {
            $add: [
              { $multiply: [{ $ifNull: ["$upvoteCount", 0] }, 2] },
              { $multiply: ["$upvoteVelocity", 3] },
              { $divide: [1000, { $add: ["$distanceMeters", 100] }] },
            ],
          },
        },
      },
      { $sort: { rankScore: -1 } },
      { $limit: 100 },
    ]);

    // Populate the creator details after aggregation
    await Post.populate(posts, {
      path: "createdBy",
      select: "name role civicScore",
    });

    return res.status(200).json({
      success: true,
      count: posts.length,
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
      const visibility = visibilityForUpvotes(post.upvoteCount);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      await Post.updateOne(
        { _id: post._id },
        {
          $set: {
            radiusKm: visibility.radiusKm,
            escalationLevel: visibility.escalationLevel,
          },
          $push: {
            recentUpvoteTimes: {
              $each: [new Date()],
              $slice: -50,
            },
          },
        }
      );

      await Post.updateOne(
        { _id: post._id },
        { $pull: { recentUpvoteTimes: { $lt: dayAgo } } }
      );

      return res.status(200).json({
        success: true,
        message: "Issue upvoted successfully",
        upvoteCount: post.upvoteCount,
        hasUpvoted: true,
        radiusKm: visibility.radiusKm,
        escalationLevel: visibility.escalationLevel,
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