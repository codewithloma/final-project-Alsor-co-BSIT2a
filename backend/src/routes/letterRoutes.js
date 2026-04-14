import express from "express";
import { 
  createLetter, 
  getAllLetters, 
  getLetterById, 
  deleteLetter 
} from "../controllers/letterController.js";

// Change "protect" to "authMiddleware" here
import { authMiddleware } from "../middleware/authMiddleware.js"; 

const router = express.Router();

router.get("/", getAllLetters);
router.get("/:id", getLetterById);

// Use the correct name here too
router.post("/", authMiddleware, createLetter);
router.delete("/:id", authMiddleware, deleteLetter);

export default router;