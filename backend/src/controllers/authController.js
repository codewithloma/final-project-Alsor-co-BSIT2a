import User from "../models/UserModel.js";
import Otp from "../models/OtpModel.js"; 
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOtpEmail } from "../utils/sendEmail.js"; 

//  SEND OTP 
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ message: "Email is required" });

    // 1. CALL THE CHECK (and make it case-insensitive/trimmed)
    const isBUEmail = (email) => email.trim().toLowerCase().endsWith("@bicol-u.edu.ph");

    // 2. IF IT'S NOT A BU EMAIL, STOP HERE
    if (!isBUEmail(email)) {
      return res.status(403).json({ 
        message: "Access restricted. Only @bicol-u.edu.ph emails are allowed." 
      });
    }

    // generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // delete existing OTP for same email
    await Otp.deleteMany({ email });

    // save new OTP (expires in 5 minutes)
    await Otp.create({
      email,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Only reaches here if the isBUEmail check passed
    await sendOtpEmail(email, code);

    res.json({ message: "OTP sent successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ---------------- REGISTER (WITH OTP CHECK) ----------------
export const register = async (req, res) => {
  try {
    const {
      email,
      username,
      password,
      display_name,
      user_type,
      student_id,
      course,
      otp
    } = req.body;

    // REQUIRED FIELDS
    if (!email || !username || !password || !user_type || !student_id || !course || !otp) {
      return res.status(400).json({ message: "All fields including OTP are required" });
    }

    // 🔥 VERIFY OTP FIRST
    const existingOtp = await Otp.findOne({ email });

    if (!existingOtp)
      return res.status(400).json({ message: "No OTP found. Please request again." });

    if (existingOtp.code !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (existingOtp.expiresAt < new Date())
      return res.status(400).json({ message: "OTP expired" });

    // DELETE OTP AFTER SUCCESS
    await Otp.deleteMany({ email });

    // CHECK DUPLICATES
    const emailExists = await User.findOne({ email });
    if (emailExists)
      return res.status(400).json({ message: "Email already exists" });

    const usernameExists = await User.findOne({ username });
    if (usernameExists)
      return res.status(400).json({ message: "Username already taken" });

    const studentIdExists = await User.findOne({ student_id });
    if (studentIdExists)
      return res.status(400).json({ message: "Student ID already registered" });

    // ROLE VALIDATION
    const allowedRoles = ["student", "officer", "department_head", "admin"];
    if (!allowedRoles.includes(user_type))
      return res.status(400).json({ message: "Invalid user role" });

    // HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // CREATE USER
    const user = await User.create({
      email,
      username,
      password: hashedPassword,
      user_type,
      student_id,
      course,
      display_name: display_name || username,
    });

    const { password: _, ...safeUser } = user.toObject();

    res.status(201).json({
      message: "User registered successfully",
      user: safeUser,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ---------------- LOGIN ----------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, role: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...safeUser } = user.toObject();

    res.json({
      message: "Login successful",
      token,
      user: safeUser,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};