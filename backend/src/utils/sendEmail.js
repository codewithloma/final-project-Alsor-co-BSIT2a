import nodemailer from "nodemailer";
import dns from "dns";

// 🔥 Force Node to prefer IPv4 over IPv6
dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,

  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },

  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
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