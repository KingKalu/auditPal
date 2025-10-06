import { Router } from "express";
import passport from "passport";
import { config } from "../config/app.config";
import {
  forgetPassword,
  googleLoginCallback,
  loginController,
  logOutController,
  registerUserController,
  resendOtp,
  resetPassword,
  verifyEmailController,
} from "../controllers/auth.controller";
import loginLimiter from "../middlewares/loginLimiter";

const failedUrl = `${config.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure`;

const authRoutes = Router();

authRoutes.post("/register", registerUserController);
authRoutes.post("/login", loginController);
authRoutes.post("/verify-email", verifyEmailController);
authRoutes.post("/logout", logOutController);
authRoutes.post("/resend-otp", resendOtp);
authRoutes.post("/forget-password", forgetPassword);
authRoutes.post("/reset-password", resetPassword);

authRoutes.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

authRoutes.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: failedUrl,
  }),
  googleLoginCallback
);

export default authRoutes;
