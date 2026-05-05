import Letter from "../models/LetterModel.js";
import User from "../models/UserModel.js";

// @desc    Create a new letter (Story-style)
// @route   POST /api/letters
export const createLetter = async (req, res) => {
  try {
    const {
      letter_title,
      letter_content,
      letter_type,
      is_anonymous,
      spotifySongName,
      spotifyArtist,
      spotifyTrackUri,
      spotifyImageUrl
    } = req.body;

    // 1. Basic Validation
    if (!letter_title || !letter_content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    // 2. Find the user to get their default display name
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3. Logic for Anonymity
    // If is_anonymous is true, we set name to "Anonymous", 
    // otherwise we use their chosen display_name or username
    const finalDisplayName = is_anonymous 
      ? "Anonymous" 
      : (user.display_name || user.username);

    // 4. Create the Letter
    const newLetter = await Letter.create({
      user_id: req.user.id,
      letter_title,
      letter_content,
      letter_type: letter_type || "general",
      display_name: finalDisplayName,
      is_anonymous,
      spotifySongName,
      spotifyArtist,
      spotifyTrackUri,
      spotifyImageUrl
    });

    res.status(201).json({
      message: "Letter posted successfully! 📩",
      letter: newLetter
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get all letters (The "Feed")
// @route   GET /api/letters
export const getAllLetters = async (req, res) => {
  try {
    const letters = await Letter.find()
      .populate("user_id", "username display_name avatar_url") 
      .sort({ createdAt: -1 });
    res.status(200).json(letters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get a single letter detail
// @route   GET /api/letters/:id
export const getLetterById = async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id)
      .populate("user_id", "username display_name avatar_url"); // ← add this
    if (!letter) return res.status(404).json({ message: "Letter not found" });
    res.status(200).json(letter);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// @desc    Delete a letter (Only by the owner)
// @route   DELETE /api/letters/:id
export const deleteLetter = async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);

    if (!letter) {
      return res.status(404).json({ message: "Letter not found" });
    }

    // Check if the user is the owner
    if (letter.user_id.toString() !== req.user.id) {
      return res.status(401).json({ message: "Unauthorized to delete this letter" });
    }

    await letter.deleteOne();
    res.json({ message: "Letter removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};