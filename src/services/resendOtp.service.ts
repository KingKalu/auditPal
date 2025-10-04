import UserModel from "../models/user.model";
import { BadRequestException } from "../utils/appError";

export const resendOtpService = async (email: string) => {
  const user = await UserModel.findOne({ email });
  if (!user) throw new BadRequestException("User not found");
};
