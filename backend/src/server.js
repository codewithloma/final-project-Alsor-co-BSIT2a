import "dotenv/config";
import profileRoutes from "./routes/profileRoutes.js";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import letterRoutes from "./routes/letterRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import organizationRoutes from "./routes/organizationRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import cboOfficerRoutes from "./routes/cboOfficerRoutes.js";


// Initialize Database
connectDB();


const app = express();


// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: false
}));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/letters", letterRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/officers", cboOfficerRoutes);



// Health Check
app.get("/", (req, res) => {
  res.send("Backend is running...");
});


// Port Configuration
const PORT = process.env.PORT || 5000;

// Use "0.0.0.0" for deployment readiness, but console log localhost for dev
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🎵 Spotify Login: http://localhost:${PORT}/api/spotify/login`);
});