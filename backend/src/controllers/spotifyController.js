import axios from "axios";
import { getSpotifyToken } from "../utils/spotify.js";

export const searchSpotify = async (req, res) => {
  try {
    const token = await getSpotifyToken();
    const query = req.query.q;

    const response = await axios.get(
      `https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`,
      { headers: { Authorization: "Bearer " + token } }
    );

    res.json(response.data.tracks.items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};