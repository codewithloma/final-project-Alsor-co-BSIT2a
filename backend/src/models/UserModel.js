import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    student_id: { type: String, required: true, unique: true},
    username: { type: String, required: true, unique: true },
    course: {
      type: String,
      enum: ["Information Technology", "Computer Science", "Animation", "Information System"],
      required: true,
    },
    department: { type:mongoose.Schema.Types.ObjectId, ref: "Department"},
    organization: { type:mongoose.Schema.Types.ObjectId, ref:"CBO", required: false},
    password: { type: String, required: true },
    
    // Role for security and middleware authorization
    user_type: {
      type: String,
      enum: ["student", "officer", "department_head", "admin"],
      required: true,
    },

    display_name: { type: String },

    // Optional improvements (future-ready)
    avatar_url: { type: String, default: "" },
    bio: { type: String, default: "" },

    is_verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);