
import fs from "fs";
import path from "path";
import { transporter } from "../utils/mailer";
import { generateOtp } from "../utils/generateOtp";


export async function sendOtpEmail(to: string, username: string) {
  const templatePath = path.join(
    __dirname,
    "../templates",
    "verify-email-otp.html"
  );
  let template = fs.readFileSync(templatePath, "utf-8");
  const { otp, otpExpires } = generateOtp();

  // Replace placeholder with OTP
  template = template
    .replace("{{OTP_CODE}}", otp)
    .replace("{{USERNAME}}", username);

  await transporter.sendMail({
    from: `"AuditPal" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your OTP Code",
    html: template,
  });

  return { otp, otpExpires };
}



export const sendPasswordResetEmail = async ({
  email,
  name,
  resetUrl,
}: {
  email: string;
  name: string;
  resetUrl: string;
}) => {
  const subject = "Reset Your Password";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          
          <center>
            <a href="${resetUrl}" class="button">Reset Password</a>
          </center>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4F46E5;">${resetUrl}</p>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>This link expires in <strong>15 minutes</strong></li>
              <li>If you didn't request this, please ignore this email</li>
              <li>Your password won't change unless you click the link and set a new one</li>
              <li>Never share this link with anyone</li>
            </ul>
          </div>
          
          <p>If you're having trouble clicking the button, make sure you're using a modern browser.</p>
          
          <p>Best regards,<br>The AuditPal Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
          <p>If you didn't request a password reset, please contact support immediately.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Use transporter directly (same as sendOtpEmail)
  await transporter.sendMail({
    from: `"AuditPal" <${process.env.GMAIL_USER}>`,
    to: email,
    subject,
    html,
  });
};
