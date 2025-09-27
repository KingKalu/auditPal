import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER, // your gmail address
    pass: process.env.GMAIL_PASS, // app password (NOT your real password)
  },
});
