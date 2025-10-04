
import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
    forgotPasswordService,
    verifyResetTokenService,
    resetPasswordService,
} from "../services/password-reset.service";

import { config } from "../config/app.config";
import { forgotPasswordSchema, resetPasswordSchema } from "../validation/password-reset.validation";


export const forgotPasswordController = asyncHandler(
    async (req: Request, res: Response) => {
        const { email } = forgotPasswordSchema.parse(req.body);

        const result = await forgotPasswordService(email);

        return res.status(HTTPSTATUS.OK).json(result);
    }
);


export const verifyResetTokenController = asyncHandler(
    async (req: Request, res: Response) => {
        const { token } = req.params;

        const { sessionToken, email } = await verifyResetTokenService(token);

        // Store session token in httpOnly cookie
        res.cookie("password_reset_session", sessionToken, {
            httpOnly: true,
            secure: config.NODE_ENV === "production",
            sameSite: config.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: "/",
        });

        // Redirect to frontend reset password page WITHOUT token in URL
        return res.redirect(
            `${config.FRONTEND_ORIGIN}/reset-password?verified=true&email=${encodeURIComponent(email)}`
        );
    }
);


export const resetPasswordController = asyncHandler(
    async (req: Request, res: Response) => {
        const { password } = resetPasswordSchema.parse(req.body);

        // Get session token from cookie (set by verifyResetToken)
        const sessionToken = req.cookies?.password_reset_session;

        if (!sessionToken) {
            return res.status(HTTPSTATUS.BAD_REQUEST).json({
                message: "Invalid or expired password reset session. Please start over.",
            });
        }

        const result = await resetPasswordService(sessionToken, password);

        // Clear the session cookie
        res.clearCookie("password_reset_session", {
            httpOnly: true,
            secure: config.NODE_ENV === "production",
            sameSite: config.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
        });

        return res.status(HTTPSTATUS.OK).json(result);
    }
);