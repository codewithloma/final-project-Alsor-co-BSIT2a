import Post from "../models/PostModel.js";
import Notification from "../models/NotificationModel.js";
import User from "../models/UserModel.js"; // 
import axios from "axios";
import cloudinary from "../config/cloudinary.js";

// ---------------- CREATE POST ----------------
export const createPost = async (req, res) => {
  try {
    const {
      content,
      design_template,
      spotify_track_url,
      is_anonymous,
      org_id,
      media,
    } = req.body;

    const post = await Post.create({
      user_id: req.user.id,
      content:           content || '',
      design_template,
      spotify_track_url,
      is_anonymous: is_anonymous || false,
      org_id: org_id || null,
      media: media || null,
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------------- GET POSTS ----------------
export const getPosts = async (req, res) => {
  try {
    const { org, author } = req.query;

    let query = {};
    if (org)    query.org_id  = org;
    if (author) query.user_id = author;

    const posts = await Post.find(query)
      .populate("user_id", "username display_name avatar_url")
      .populate("org_id", "org_name acronym")
      .populate("comments.user_id", "username display_name avatar_url")
      .populate({                                   
        path: "shared_from",
        populate: {
            path: "user_id",
            select: "username display_name avatar_url"
        }
    })
      .sort({ createdAt: -1 });

    // Transform so frontend gets likes_count + liked_by_me
    const userId = req.user?.id;
    const transformed = posts.map(p => ({
      ...p.toObject(),
      likes_count:  p.reactions.length,
      liked_by_me:  userId ? p.reactions.map(r => r.toString()).includes(userId) : false,
      comments_count: p.comments.length,
    }));

    res.json(transformed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// ---------------- SPOTIFY SEARCH ----------------
export const searchSpotify = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ message: "Query is required" });

    const tokenRes = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({ grant_type: "client_credentials" }),
      {
        headers: {
          Authorization: "Basic " + Buffer.from(
            process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
          ).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const token = tokenRes.data.access_token;
    const response = await axios.get("https://api.spotify.com/v1/search", {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: query, type: "track", limit: 10 },
    });

    res.json(response.data.tracks.items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------------- REACT ----------------
export const reactToPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user.id;
    const ownerId = post.user_id.toString();

    if (post.reactions.includes(userId)) {
      // Un-react — just remove, no notification
      post.reactions = post.reactions.filter(id => id.toString() !== userId);
    } else {
      post.reactions.push(userId);

      if (ownerId !== userId) {
        // ← FETCH sender from DB
        const sender = await User.findById(userId).select("display_name username");

        await Notification.create({
          user_id: ownerId,
          from_user: userId,
          type: "reaction",
          message: `${sender.display_name || sender.username} reacted to your post`,
          related_id: post._id,
        });
      }
    }

    await post.save();
    res.json({ reactions: post.reactions.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------------- COMMENT ----------------
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);

    post.comments.push({ user_id: req.user.id, text });

    if (post.user_id.toString() !== req.user.id) {
      // ← FETCH sender from DB
      const sender = await User.findById(req.user.id).select("display_name username");

      await Notification.create({
        user_id: post.user_id,
        from_user: req.user.id,
        type: "comment",
        message: `${sender.display_name || sender.username} commented on your post`,
        related_id: post._id,
      });
    }

    await post.save();
    res.json(post.comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------------- SHARE ----------------
export const sharePost = async (req, res) => {
  try {
    const postToShare = await Post.findById(req.params.id);
    const { caption } = req.body;

    // ← If this post is already a share, point to the ORIGINAL post
    const originalId = postToShare.shared_from 
      ? postToShare.shared_from 
      : postToShare._id;

    // Fetch the actual original post for the content/spotify
    const originalPost = await Post.findById(originalId);

    const shared = await Post.create({
      user_id:           req.user.id,
      content:           caption || '',
      design_template:   originalPost.design_template,
      spotify_track_url: originalPost.spotify_track_url,
      shared_from:       originalId, // ← always points to the root original
    });

    // Notify the ORIGINAL post owner, not the sharer
    if (originalPost.user_id.toString() !== req.user.id) {
      const sender = await User.findById(req.user.id).select("display_name username");
      await Notification.create({
        user_id:    originalPost.user_id,
        from_user:  req.user.id,
        type:       "share",
        message:    `${sender.display_name || sender.username} shared your post`,
        related_id: originalId,
      });
    }

    res.status(201).json(shared);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------------- UPDATE ----------------
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.user_id.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    Object.assign(post, req.body);
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------------- DELETE ----------------
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.user_id.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    await post.deleteOne();
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user_id", "username display_name avatar_url")
      .populate("comments.user_id", "username display_name avatar_url")
      .populate({
        path: "shared_from",
        populate: {
          path: "user_id",
          select: "username display_name avatar_url"
        }
      });

    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};