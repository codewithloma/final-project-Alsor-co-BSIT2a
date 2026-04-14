import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import letterRoutes from "./routes/letterRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";




connectDB();

const app = express();


app.use(cors());
app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/letters", letterRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/letters", letterRoutes);
app.use("/api/feedback", feedbackRoutes);



app.get("/", (req, res) => {
  res.send("Backend is running mga lado...");
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🎵 Spotify Login: http://127.0.0.1:${PORT}/api/spotify/login`);
});