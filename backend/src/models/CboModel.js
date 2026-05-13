import mongoose from "mongoose";

const CBOSchema = new mongoose.Schema({
  org_name: { 
    type: String, 
    required: [true, "Organization name is required"] 
  },
  acronym: { 
    type: String 
  },
  description: { 
    type: String, 
    default: "" 
  },
  // This is where your Cloudinary URL (tsa.webp) will be saved
  logo_url: { 
    type: String, 
    default: "" 
  },
  department: {
    type: String,
    required: [true, "Department is required"],
    enum: [
      "Computer Studies Department",
      "Engineering Department",
      "Nursing Department",
      "Technology Department",
      "Entrepreneur Department",
      "Education Department Technology"
    ]
  },
  created_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  members: [
    {
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: { type: String, default: "member" },
      status: { type: String, default: "pending" }
    }
  ]
}, { timestamps: true });

// Exporting as "CBO" to keep it consistent with your file name CboModel.js
const CBO = mongoose.model("CBO", CBOSchema);
export default CBO;