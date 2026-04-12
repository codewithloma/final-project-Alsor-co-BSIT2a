import Post from "../models/PostModel.js";

// CREATE POST
export const createPost = async (req, res) => {
  try {
    const { content, design_template, spotify_track_url, is_anonymous } = req.body;

    const post = await Post.create({
      user_id: req.user.id,       // automatically from middleware
      content,
      design_template,
      spotify_track_url,
      is_anonymous: is_anonymous || false,
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// GET ALL POSTS
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user_id", "username display_name")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// LIKE / UNLIKE POST
export const reactToPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user.id;

    if (post.reactions.includes(userId)) {
      // Already liked → remove like
      post.reactions = post.reactions.filter(id => id.toString() !== userId);
    } else {
      // Add like
      post.reactions.push(userId);
    }

    await post.save();
    res.json({ message: "Reaction updated", reactions: post.reactions.length });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ADD COMMENT
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({
      user_id: req.user.id,
      text,
      date: new Date(),
    });

    await post.save();
    res.json(post.comments);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// SHARE POST
export const sharePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const shared = await Post.create({
      user_id: req.user.id,
      content: post.content,
      design_template: post.design_template,
      spotify_track_url: post.spotify_track_url,
      shared_from: postId,
    });

    res.status(201).json(shared);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// UPDATE POST
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Ownership check
    if (post.user_id.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized to update" });

    const { content, design_template, spotify_track_url, is_anonymous } = req.body;

    post.content = content ?? post.content;
    post.design_template = design_template ?? post.design_template;
    post.spotify_track_url = spotify_track_url ?? post.spotify_track_url;
    post.is_anonymous = is_anonymous ?? post.is_anonymous;

    await post.save();
    res.json(post);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// DELETE POST
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Only owner can delete
    if (post.user_id.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized to delete" });

    await post.deleteOne();
    res.json({ message: "Post deleted" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};