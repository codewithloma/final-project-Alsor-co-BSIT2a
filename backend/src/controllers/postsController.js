import Post from "../models/PostModel.js";
import Notification from "../models/NotificationModel.js";
import axios from "axios";



// ---------------- CREATE POST ----------------
export const createPost = async (req, res) => {
  try {
    const {
      content,
      design_template,
      spotify_track_url,
      is_anonymous,
      org_id
    } = req.body;

    const post = await Post.create({
      user_id: req.user.id,
      content,
      design_template,
      spotify_track_url,
      is_anonymous: is_anonymous || false,
      org_id: org_id || null,
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------------- GET POSTS ----------------
export const getPosts = async (req, res) => {
  try {
    const { org } = req.query;

    let query = {};

    if (org) {
      query.org_id = org;
    }

    const posts = await Post.find(query)
      .populate("user_id", "username display_name")
      .populate("org_id", "org_name acronym")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------------- SPOTIFY SEARCH ----------------
export const searchSpotify = async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) return res.status(400).json({ message: "Query is required" });

    // Get token (Client Credentials Flow)
    const tokenRes = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({ grant_type: "client_credentials" }),
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.SPOTIFY_CLIENT_ID +
              ":" +
              process.env.SPOTIFY_CLIENT_SECRET
            ).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const token = tokenRes.data.access_token;

    const response = await axios.get(
      "https://api.spotify.com/v1/search",
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { q: query, type: "track", limit: 10 },
      }
    );

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
      post.reactions = post.reactions.filter(
        id => id.toString() !== userId
      );
    } else {
      post.reactions.push(userId);

      // 🔔 CREATE NOTIFICATION
      if (ownerId !== userId) {
        await Notification.create({
          user_id: ownerId,
          from_user: userId,
          type: "reaction",
          message: "reacted to your post",
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

    post.comments.push({
      user_id: req.user.id,
      text,
    });

    // 🔔 NOTIFY OWNER
    if (post.user_id.toString() !== req.user.id) {
      await Notification.create({
        user_id: post.user_id,
        from_user: req.user.id,
        type: "comment",
        message: "commented on your post",
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
    const original = await Post.findById(req.params.id);

    const shared = await Post.create({
      user_id: req.user.id,
      content: original.content,
      design_template: original.design_template,
      spotify_track_url: original.spotify_track_url,
      shared_from: original._id,
    });

    if (original.user_id.toString() !== req.user.id) {
      await Notification.create({
        user_id: original.user_id,
        from_user: req.user.id,
        type: "share",
        message: "shared your post",
        related_id: original._id,
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