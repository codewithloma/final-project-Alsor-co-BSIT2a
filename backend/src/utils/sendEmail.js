import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // must be false for 587
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// verify transporter on startup (optional but useful)
transporter.verify((error) => {
  if (error) {
    console.error("❌ Gmail transporter error:", error.message);
  } else {
    console.log("✅ Gmail server is ready");
  }
});

// SEND OTP EMAIL
export const sendOtpEmail = async (email, code) => {
  try {
    const info = await transporter.sendMail({
      from: `"DearBUP" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "DearBUP Verification Code",
      html: `
        <div style="font-family: Arial; text-align: center;">
          <h2>Your OTP Code</h2>
          <h1 style="letter-spacing: 5px;">${code}</h1>
          <p>This code will expire in 5 minutes.</p>
        </div>
      `,
    });

    console.log("✅ Email sent:", info.messageId);
  } catch (error) {
    console.error("❌ Email error:", error);
    throw new Error("Failed to send email");
  }
};