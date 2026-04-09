import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema({
  dept_name: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("Department", DepartmentSchema);