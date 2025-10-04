import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import {
  forgetPasswordSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../validation/auth.validation";
import { HTTPSTATUS } from "../config/http.config";
import {
  registerUserService,
  verifyOtpService,
} from "../services/auth.service";
import passport from "passport";
import { config } from "../config/app.config";
import UserModel from "../models/user.model";
import { getTemplate } from "../utils/getTemplate";
import { sendEmail } from "../services/email.service";
import { ExpireException, NotFoundException } from "../utils/appError";

export const googleLoginCallback = asyncHandler(
  async (req: Request, res: Response) => {
    return res.redirect(`${config.FRONTEND_GOOGLE_CALLBACK_URL}?success=true`);
  }
);

export const registerUserController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const body = registerSchema.parse({ ...req.body });

    const user = await registerUserService(body);

    req.login(user, (err) => {
      if (err) {
        return next(err);
      }

      return res.status(HTTPSTATUS.CREATED).json({
        message: "User created successfully",
        user,
      });
    });
  }
);

export const loginController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      "local",
      (
        err: Error | null,
        user: Express.User | false,
        info: { message: string } | undefined
      ) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return res.status(HTTPSTATUS.UNAUTHORIZED).json({
            message: info?.message || "Invalid email or password",
          });
        }

        req.login(user, (err) => {
          if (err) {
            return next(err);
          }

          return res.status(HTTPSTATUS.OK).json({
            message: "Logged in successfully",
            user,
          });
        });
      }
    )(req, res, next);
  }
);

export const verifyEmailController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { otp } = verifyEmailSchema.parse({ ...req.body });
    const email = req?.user?.email;
    const user = await verifyOtpService({ email, otp });

    if (user) {
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }

        return res.status(HTTPSTATUS.CREATED).json({
          message: "User verify successfully",
          user,
        });
      });
    }
  }
);

export const logOutController = asyncHandler(
  async (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res
          .status(HTTPSTATUS.INTERNAL_SERVER_ERROR)
          .json({ error: "Failed to log out" });
      }
    });
    req.session = null;
    return res
      .status(HTTPSTATUS.OK)
      .json({ message: "Logged out successfully" });
  }
);

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const email = req?.user?.email;
  const user = await UserModel.findOne({ email });

  if (user) {
    const { template, otp, otpExpires } = getTemplate("verify-email-otp.html");

    await sendEmail(
      user.email,
      template
        .replace("{{USERNAME}}", user.firstName)
        .replace("{{OTP_CODE}}", otp)
    );
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
  }

  return res.status(HTTPSTATUS.OK).json({
    message: "Otp sent Successfully",
  });
});

export const forgetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = forgetPasswordSchema.parse({ ...req.body });
    const user = await UserModel.findOne({ email });

    if (user) {
      const resetLink = `${config.FRONTEND_GOOGLE_CALLBACK_URL}/reset-password?email=${user.email}`;
      const { template, otp, otpExpires } = getTemplate("reset-password.html");

      await sendEmail(
        user.email,
        template
          .replace("{{USERNAME}}", user.firstName)
          .replace("{{RESET_LINK}}", resetLink)
      );
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    }

    return res.status(HTTPSTATUS.OK).json({
      message: "Otp sent Successfully",
    });
  }
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, newPassword } = resetPasswordSchema.parse({ ...req.body });
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new NotFoundException("User not Found");
    }
    if (user) {
      if (user.otpExpires < new Date()) {
        throw new ExpireException("Link expired");
      }
      user.password = newPassword;
      const savedUser = await user?.save();
      return res.status(HTTPSTATUS.OK).json({
        message: "Password Changed Successfully",
        user: savedUser.omitPassword(),
      });
    }
  }
);
