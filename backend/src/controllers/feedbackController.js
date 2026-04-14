import Feedback from "../models/FeedbackModel.js";
import User from "../models/UserModel.js";
import Department from "../models/DepartmentModel.js";


// @desc    Submit new feedback to a department
// @route   POST /api/feedback
export const submitFeedback = async (req, res) => {
  try {
    const { dept_id, content, is_anonymous } = req.body;

    // 1. Validation
    if (!dept_id || !content) {
      return res.status(400).json({ message: "Department ID and content are required" });
    }

    // 2. Check if department exists
    const department = await Department.findById(dept_id);
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    // 3. Create feedback
    const feedback = await Feedback.create({
      user_id: req.user.id, // From authMiddleware
      dept_id,
      content,
      is_anonymous: is_anonymous || false,
    });

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get feedback for a specific department (For Dept Heads/Admin)
// @route   GET /api/feedback/dept/:deptId
export const getDeptFeedback = async (req, res) => {
  try {
    // We populate user_id but only if it's NOT anonymous
    // However, usually Dept Heads shouldn't see names if it's anonymous
    const feedbackList = await Feedback.find({ dept_id: req.params.deptId })
      .populate("user_id", "display_name username") // Optional
      .sort({ createdAt: -1 });

    // Clean data: If anonymous, mask the user info before sending to frontend
    const sanitizedFeedback = feedbackList.map(item => {
      const doc = item.toObject();
      if (doc.is_anonymous) {
        delete doc.user_id;
        doc.user_display_name = "Anonymous Student";
      } else {
        doc.user_display_name = doc.user_id?.display_name || "User";
      }
      return doc;
    });

    res.status(200).json(sanitizedFeedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};