import User from "../models/UserModel.js";

// GET LOGGED-IN USER PROFILE
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE LOGGED-IN USER PROFILE
export const updateProfile = async (req, res) => {
  try {
    const { display_name, bio, avatar_url } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        display_name,
        bio,
        avatar_url
      },
      { new: true }
    ).select("-password");

    res.json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};