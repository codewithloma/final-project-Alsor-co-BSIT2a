import axios from "axios";

let token = null;
let tokenExpires = null;

export const getSpotifyToken = async () => {
  if (token && tokenExpires > Date.now()) return token;

  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    "grant_type=client_credentials",
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  token = response.data.access_token;
  tokenExpires = Date.now() + response.data.expires_in * 1000;

  return token;
};