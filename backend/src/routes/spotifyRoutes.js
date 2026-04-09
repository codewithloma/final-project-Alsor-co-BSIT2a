import express from "express";
import querystring from "querystring";
import axios from "axios";

const router = express.Router();

// 1. LOGIN ROUTE
router.get("/login", (req, res) => {
  const scope = "user-read-private user-read-email";
  const params = querystring.stringify({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: scope,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

// 2. CALLBACK ROUTE
router.get("/callback", async (req, res) => {
  const code = req.query.code || null;
  if (!code) return res.status(400).json({ error: "No code provided" });

  try {
    const response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      data: querystring.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      }),
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
        ).toString('base64'),
      },
    });

    const { access_token, refresh_token, expires_in } = response.data;
    res.json({ message: "Access Token Obtained!", access_token, refresh_token, expires_in });
  } catch (error) {
    res.status(500).json({ error: "Failed to get token" });
  }
});

// 3.  SEARCH ROUTE 
router.get("/search", async (req, res) => {
  const { q, token } = req.query; 

  if (!q || !token) {
    return res.status(400).json({ error: "Missing search query or token" });
  }

  try {
    const response = await axios.get("https://api.spotify.com/v1/search", {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: q, type: "track", limit: 10 },
    });

    res.json(response.data.tracks.items);
  } catch (error) {
    console.error("Search Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to search for songs" });
  }
});


export default router;