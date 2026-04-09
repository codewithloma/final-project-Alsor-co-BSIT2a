import Post from "../models/PostModel.js";

export const createPost = async (req, res) => {
  try {
    const { user_id, content } = req.body;
    const post = await Post.create({ user_id, content });
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("user_id", "username display_name");
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};