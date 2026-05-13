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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const posts = await Post.find({ user_id: id })
      .populate('user_id', 'username display_name avatar_url')
      .populate({
        path: 'shared_from',
        select: 'content media spotify_track_url createdAt user_id',
        populate: {
          path: 'user_id',
          select: 'username display_name avatar_url'
        }
      })
      .sort({ createdAt: -1 })
      .lean();

    const transformedPosts = posts.map(post => ({
      ...post,
      likes_count: post.reactions?.length ?? 0,
      comments_count: post.comments?.length ?? 0,
      shared_from: post.shared_from && post.shared_from.user_id
        ? post.shared_from
        : null
    }));

    res.json(transformedPosts);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE COMMENT FUNCTION (IDINAGDAG)
export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params; // 'id' ay ang Post ID
    const userId = req.user.id;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const commentIndex = post.comments.findIndex(
      (c) => c._id.toString() === commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Siguraduhing author siya ng comment bago payagang i-delete
    if (post.comments[commentIndex].user_id.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized to delete this comment" });
    }

    post.comments.splice(commentIndex, 1);
    await post.save();

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};