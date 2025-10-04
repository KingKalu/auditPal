import { Router } from "express";
import passport from "passport";
import { config } from "../config/app.config";
import {
  googleLoginCallback,
  loginController,
  logOutController,
  registerUserController,
  verifyEmailController,
  getCurrentUserController,
} from "../controllers/auth.controller";
import loginLimiter from "../middlewares/loginLimiter";
import { isAuthenticated } from "../middlewares/isAuthenticated.middleware";

const failedUrl = `${config.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure`;

const authRoutes = Router();

authRoutes.post("/register", registerUserController);
authRoutes.post("/login", loginLimiter, loginController);

authRoutes.post("/verify-email", isAuthenticated, verifyEmailController);
authRoutes.post("/logout", isAuthenticated, logOutController);
authRoutes.get("/me", isAuthenticated, getCurrentUserController);

authRoutes.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: true,
  })
);

authRoutes.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: failedUrl,
    session: true,
  }),
  googleLoginCallback
);

export default authRoutes;
