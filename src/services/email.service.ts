import fs from "fs";
import path from "path";
import { transporter } from "../utils/mailer";
import { generateOtp } from "../utils/generateOtp";

export async function sendOtpEmail(to: string, username: string) {
  const templatePath = path.join(__dirname, "../templates", "otp.html");
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
