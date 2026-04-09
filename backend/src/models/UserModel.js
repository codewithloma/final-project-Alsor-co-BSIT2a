import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  user_type: { type: String, enum: ["student", "officer", "department_head", "admin"], required: true },
  display_name: { type: String },
}, { timestamps: true });

export default mongoose.model("User", UserSchema);