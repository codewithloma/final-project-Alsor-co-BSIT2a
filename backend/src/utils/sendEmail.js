import nodemailer from "nodemailer";
import dns from "dns";

// 🔥 Force IPv4 resolution (important for Render)
dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS upgrade via STARTTLS
  requireTLS: true,

  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS, // MUST be Gmail App Password
  },

  // 🔥 IMPORTANT: force IPv4 only (fixes ENETUNREACH IPv6 issue)
  family: 4,

  // Stability improvements (Render-friendly)
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
});

// OPTIONAL: verify SMTP connection on startup (helps debugging)
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Connection Failed:", error.message);
  } else {
    console.log("✅ SMTP Ready - Email service active");
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

    console.log("✅ OTP Email sent successfully:", info.messageId);

  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    throw new Error("Failed to send email");
  }
};