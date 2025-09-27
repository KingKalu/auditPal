import mongoose, { Date } from "mongoose";
import UserModel, { UserDocument } from "../models/user.model";
import AccountModel from "../models/account.model";
import {
  BadRequestException,
  ExpireException,
  NotFoundException,
  UnauthorizedException,
} from "../utils/appError";
import { ProviderEnum } from "../enums/account-provider.enum";
import { sendOtpEmail } from "./email.service";

export const loginOrCreateAccountService = async (data: {
  provider: string;
  firstName?: string;
  lastName?: string;
  providerId: string;
  picture?: string;
  email?: string;
}) => {
  const { providerId, provider, firstName, lastName, email, picture } = data;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    console.log("Started Session...");

    let user = await UserModel.findOne({ email }).session(session);

    if (!user) {
      user = new UserModel({
        email,
        firstName,
        lastName,
        profilePicture: picture || null,
      });
      await user.save({ session });

      const account = new AccountModel({
        userId: user._id,
        provider,
        providerId,
      });
      await account.save({ session });
    }
    await session.commitTransaction();
    session.endSession();
    console.log("End Session...");

    return { user };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  } finally {
    session.endSession();
  }
};

export const registerUserService = async (body: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}) => {
  const { email, firstName, lastName, password } = body;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const existingUser = await UserModel.findOne({ email }).session(session);
    if (existingUser) {
      throw new BadRequestException("Email already exists");
    }

    const user = new UserModel({
      email,
      firstName,
      lastName,
      password,
    });

    const savedUser = await user.save({ session });

    const account = new AccountModel({
      userId: user._id,
      provider: ProviderEnum.EMAIL,
      providerId: email,
    });
    await account.save({ session });

    // const { otp, otpExpires } = await sendOtpEmail(email, firstName);
    // savedUser.otp = otp;
    // savedUser.otpExpires = otpExpires;
    const userData = await savedUser.save({ session });

    await session.commitTransaction();
    session.endSession();
    console.log("End Session...");

    return userData.omitPassword();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const verifyEmailService = async (body: {
  userId?: string;
  otp: string;
}) => {
  const { userId, otp } = body;

  const user = await UserModel.findById(userId);

  if (!user) {
    throw new NotFoundException("User not Found");
  }

  if (user.otpExpires < new Date()) {
    throw new ExpireException("OTP expired");
  }

  if (user.otp !== otp) {
    throw new BadRequestException("OTP does not match");
  }

  if (Boolean(user)) {
    user.email_verified = true;
    return (await user?.save()).omitPassword();
  }
};

export const verifyUserService = async ({
  email,
  password,
  provider = ProviderEnum.EMAIL,
}: {
  email: string;
  password: string;
  provider?: string;
}) => {
  const account = await AccountModel.findOne({ provider, providerId: email });
  if (!account) {
    throw new NotFoundException("Invalid email or password");
  }

  const user = await UserModel.findById(account.userId);
  if (!user) {
    throw new NotFoundException("User not found for the given account");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedException("Invalid email or password");
  }

  return user.omitPassword();
};
