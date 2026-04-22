import mongoose from "mongoose";

const courseMap = {
  BSIT: "Bachelor of Science in Information Technology",
  BSCS: "Bachelor of Science in Computer Science",
  BSIS: "Bachelor of Science in Information System",
  "BSIT-ANIM": "Bachelor of Science in Information Technology Major in Animation"
};

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    student_id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },

    course: {
      type: String,
      enum: Object.values(courseMap),
      required: true,
      set: (value) => {
        const normalized = value?.trim().toUpperCase();
        return courseMap[normalized] || value;
      }
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department"
    },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CBO",
      required: false
    },

    password: { type: String, required: true },

    user_type: {
      type: String,
      enum: ["student", "officer", "department_head", "admin"],
      required: true
    },

    display_name: { type: String },

    avatar_url: { type: String, default: "" },
    bio: { type: String, default: "" },

    is_verified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);