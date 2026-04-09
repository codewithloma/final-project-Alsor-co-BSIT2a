import mongoose from "mongoose";

const DepartmentHeadSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dept_id: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
  head_name: { type: String, required: true },
  contact_email: { type: String },
}, { timestamps: true });

export default mongoose.model("DepartmentHead", DepartmentHeadSchema);