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

  description: { type: String, default: "" },

  logo_url: { type: String, default: "" },

  department: {
    type: String,
    required: true
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