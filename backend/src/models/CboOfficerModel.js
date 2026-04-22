import mongoose from "mongoose";

const CBOOfficerSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    org_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CBO",
      required: true,
    },

    officer_role: {
      type: String,
      required: true,
      enum: ["president", "vice_president", "secretary", "treasurer", "member"],
      default: "member",
    },

    display_name: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("CBOOfficer", CBOOfficerSchema);