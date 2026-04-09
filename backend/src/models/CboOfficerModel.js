import mongoose from "mongoose";

const CBOOfficerSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  org_id: { type: mongoose.Schema.Types.ObjectId, ref: "CBO", required: true },
  officer_role: { type: String, required: true },
  display_name: { type: String },
}, { timestamps: true });

export default mongoose.model("CBOOfficer", CBOOfficerSchema);