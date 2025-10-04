import crypto from "crypto";
import UserModel from "../models/user.model";
import {
    BadRequestException,
    ExpireException,
    NotFoundException,
} from "../utils/appError";
import { sendPasswordResetEmail } from "./email.service";
import { config } from "../config/app.config";

export const forgotPasswordService = async (email: string) => {
    const user = await UserModel.findOne({ email });

    if (!user) {
        throw new NotFoundException(
            "If an account with that email exists, a password reset link has been sent."
        );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetUrl = `${config.BACKEND_URL}/api/auth/reset-password/${resetToken}`;

    await sendPasswordResetEmail({
        email: user.email,
        name: user.firstName,
        resetUrl,
    });

    return {
        message:
            "If an account with that email exists, a password reset link has been sent.",
    };
};

export const verifyResetTokenService = async (token: string) => {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await UserModel.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
        throw new ExpireException(
            "Password reset token is invalid or has expired. Please request a new one."
        );
    }

    const tempSessionToken = crypto.randomBytes(32).toString("hex");
    const hashedSessionToken = crypto
        .createHash("sha256")
        .update(tempSessionToken)
        .digest("hex");

    user.passwordResetToken = hashedSessionToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    return {
        sessionToken: tempSessionToken,
        email: user.email,
    };
};

export const resetPasswordService = async (
    sessionToken: string,
    newPassword: string
) => {
    const hashedToken = crypto
        .createHash("sha256")
        .update(sessionToken)
        .digest("hex");

    const user = await UserModel.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
        throw new ExpireException(
            "Password reset session has expired. Please start the process again."
        );
    }

    if (newPassword.length < 8) {
        throw new BadRequestException(
            "Password must be at least 8 characters long"
        );
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return {
        message: "Password has been reset successfully. You can now log in.",
    };
};
