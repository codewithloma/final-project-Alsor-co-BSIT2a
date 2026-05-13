import SibApiV3Sdk from "sib-api-v3-sdk";

const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

export const sendOtpEmail = async (email, code) => {
  try {
    const response = await tranEmailApi.sendTransacEmail({
      sender: {
        email: process.env.GMAIL_USER,
        name: "DearBUP",
      },
      to: [
        {
          email: email,
        },
      ],
      subject: "DearBUP Verification Code",
      htmlContent: `
        <div style="font-family: Arial; text-align: center;">
          <h2>Your OTP Code</h2>
          <h1 style="letter-spacing: 5px;">${code}</h1>
          <p>This code will expire in 5 minutes.</p>
        </div>
      `,
    });

    console.log("✅ OTP sent via Brevo:", response.messageId);
  } catch (error) {
    console.error("❌ Brevo email error:", error);
    throw new Error("Failed to send OTP email");
  }
};