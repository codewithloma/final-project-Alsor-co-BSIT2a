import mongoose from "mongoose";

const LetterSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  letter_title: { type: String, required: true },
  letter_content: { type: String, required: true },
  letter_type: { type: String, enum: ["confession", "gratitude", "concern", "general"] },
  display_name: { type: String },
  is_anonymous: { type: Boolean, default: false },

  // --- NEW SPOTIFY FIELDS ---
  spotifySongName: { type: String },
  spotifyArtist: { type: String },
  spotifyTrackUri: { type: String },
  spotifyImageUrl: { type: String },
  // --------------------------

}, { timestamps: true });

export default mongoose.model("Letter", LetterSchema);