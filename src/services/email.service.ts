import { transporter } from "../utils/mailer";

export async function sendEmail(email: string, template: string) {
  await transporter.sendMail({
    from: `"AuditPal" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Your OTP Code",
    html: template,
  });
}
