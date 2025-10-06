export const generateOtp = () => {
  const otp = Math.floor(Math.random() * 900000 + 100000);
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  return { otp: otp.toString(), otpExpires };
};
