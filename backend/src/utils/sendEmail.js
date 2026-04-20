import nodemailer from "nodemailer";

// create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});
// send OTP email
export const sendOtpEmail = async (email, code) => {
  try {
    await transporter.sendMail({
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

    console.log("✅ Email sent to:", email);

  } catch (error) {
    console.error("❌ Email error:", error.message);
    throw new Error("Failed to send email");
  }
};