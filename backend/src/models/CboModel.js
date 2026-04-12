import mongoose from "mongoose";

const CBOSchema = new mongoose.Schema({
  org_name: { type: String, required: true },
  acronym: { type: String },
}, { timestamps: true });

export default mongoose.model("CBO", CBOSchema);