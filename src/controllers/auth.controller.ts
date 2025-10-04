import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import {
  registerSchema,
  verifyEmailSchema,
  loginSchema,
} from "../validation/auth.validation";
import { HTTPSTATUS } from "../config/http.config";
import {
  registerUserService,
  verifyEmailService,
} from "../services/auth.service";
import passport from "passport";
import { config } from "../config/app.config";
import { UnauthorizedException } from "../utils/appError";
import UserModel from "../models/user.model";

export const googleLoginCallback = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.redirect(
        `${config.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure&message=Authentication failed`
      );
    }

    await UserModel.findByIdAndUpdate(req.user._id, {
      lastLogin: new Date(),
    }).exec();

    // Save session before redirect to ensure cookie is set
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.redirect(
          `${config.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure&message=Session error`
        );
      }

      return res.redirect(
        `${config.FRONTEND_GOOGLE_CALLBACK_URL}?status=success`
      );
    });
  }
);

export const googleLoginCallbackJSON = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        success: false,
        message: "Authentication failed",
      });
    }

    await UserModel.findByIdAndUpdate(req.user._id, {
      lastLogin: new Date(),
    }).exec();

    return res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Logged in successfully",
      user: req.user,
    });
  }
);

export const registerUserController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const body = registerSchema.parse({ ...req.body });
    const user = await registerUserService(body);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "User created successfully",
      user,
    });
  }
);

export const loginController = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = loginSchema.parse({ ...req.body });
  } catch (error) {
    return next(error);
  }

  passport.authenticate(
    "local",
    (
      err: Error | null,
      user: Express.User | false,
      info?: { message?: string }
    ) => {
      if (err) return next(err);

      if (!user) {
        return next(
          new UnauthorizedException(
            info?.message || "Invalid email or password"
          )
        );
      }

      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);

        void UserModel.findByIdAndUpdate(user._id, {
          lastLogin: new Date(),
        }).exec();

        return res.status(HTTPSTATUS.OK).json({
          message: "Logged in successfully",
          user,
        });
      });
    }
  )(req, res, next);
};

export const verifyEmailController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedException("Not authenticated");
    }

    const { otp } = verifyEmailSchema.parse({ ...req.body });
    const userId = req.user._id.toString();
    const user = await verifyEmailService({ userId, otp });

    return res.status(HTTPSTATUS.OK).json({
      message: "Email verified successfully",
      user,
    });
  }
);

export const logOutController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }

      req.session?.destroy((destroyErr) => {
        if (destroyErr) {
          return next(destroyErr);
        }

        res.clearCookie("sessionId", {
          httpOnly: true,
          secure: config.NODE_ENV === "production",
          sameSite: config.NODE_ENV === "production" ? "none" : "lax",
          domain: config.COOKIE_DOMAIN || undefined,
          path: "/",
        });

        return res.status(HTTPSTATUS.OK).json({
          message: "Logged out successfully",
        });
      });
    });
  }
);

export const getCurrentUserController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedException("Not authenticated");
    }

    return res.status(HTTPSTATUS.OK).json({
      user: req.user,
    });
  }
);