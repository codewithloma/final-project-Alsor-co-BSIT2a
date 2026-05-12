import User from "../models/UserModel.js";
import Post from "../models/PostModel.js";
import mongoose from "mongoose";

// GET LOGGED-IN USER PROFILE
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("organization", "org_name acronym")
      .populate("department", "name");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const postsCount = await Post.countDocuments({ user_id: user._id });

    res.json({
      user,
      postsCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE LOGGED-IN USER PROFILE 
export const updateProfile = async (req, res) => {
  try {
    const { display_name, bio, avatar_url } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        display_name,
        bio,
        avatar_url
      },
      { returnDocument: "after" }
    )
      .select("-password")
      .populate("organization", "org_name acronym")
      .populate("department", "name");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET OTHER USER PROFILE
export const getUserProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    // VALIDATE OBJECT ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id)
      .select("-password")
      .populate("organization", "org_name acronym")
      .populate("department", "name");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const postsCount = await Post.countDocuments({ user_id: user._id });

    res.json({
      user,
      postsCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  GET POSTS OF SPECIFIC USER
export const getUserPosts = async (req, res) => {
  try {
    const { id } = req.params;

    // VALIDATE OBJECT ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const posts = await Post.find({ user_id: id })
      .populate("user_id", "username display_name avatar_url")
      .populate("org_id", "org_name acronym")
      .populate("comments.user_id", "username display_name avatar_url")
      .sort({ createdAt: -1 });

    const transformedPosts = posts.map(post => ({
      ...post.toObject(),
      likes_count: post.reactions.length,
      comments_count: post.comments.length
    }));

    res.json(transformedPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};