import cloudinary from "../config/cloudinary.js";

export const uploadAvatar = async (req, res) => {
  try {
    const { image } = req.body;

    const result = await cloudinary.uploader.upload(image, {
      folder: "dearbup/profile",
    });

    res.json({
      imageUrl: result.secure_url,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const uploadPostMedia = async (req, res) => {
  try {
    const { file, mediaType } = req.body;

    if (!file) {
      return res.status(400).json({
        message: "No media file provided",
      });
    }

    const detectedType = mediaType || (
      file.startsWith("data:video") ? "video" : "image"
    );

    const result = await cloudinary.uploader.upload(file, {
      folder: "dearbup/posts",
      resource_type: detectedType === "video" ? "video" : "image",
    });

    res.json({
      mediaUrl: result.secure_url,
      mediaType: detectedType,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};