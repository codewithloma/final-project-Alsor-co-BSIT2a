import mongoose from "mongoose";

const CBOSchema = new mongoose.Schema({
  org_name: { type: String, required: true },
  acronym: { type: String },

  description: { type: String, default: "" },

  logo_url: { type: String, default: "" },

  // NEW FIELD (IMPORTANT)
  department: {
    type: String,
    required: true,
    enum: [
      "Computer Studies Department",
      "Engineering Department",
      "Nursing Department",
      "Technology Department",
      "Entrepreneur Department",
      "Education Department Technology"
    ]
  },

  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  members: [
    {
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: { type: String, default: "member" },
      status: { type: String, default: "pending" }
    }
  ]
}, { timestamps: true });

export default mongoose.model("CBO", CBOSchema);