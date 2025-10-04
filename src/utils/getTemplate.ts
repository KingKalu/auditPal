import fs from "fs";
import path from "path";
import { generateOtp } from "./generateOtp";

export const getTemplate = (file: string) => {
  const templatePath = path.join(__dirname, "../templates", file);
  const template = fs.readFileSync(templatePath, "utf-8");
  const { otp, otpExpires } = generateOtp();

  return { template, otp, otpExpires };
};
