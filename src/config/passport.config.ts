import passport from "passport";
import { Request } from "express";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import { config } from "./app.config";
import { NotFoundException } from "../utils/appError";
import { ProviderEnum } from "../enums/account-provider.enum";
import {
  loginOrCreateAccountService,
  verifyUserService,
} from "../services/auth.service";
// import { LeanUser } from "../@types/user.model"; 
import UserModel from "../models/user.model";

if (
  !config.GOOGLE_CLIENT_ID ||
  !config.GOOGLE_CLIENT_SECRET ||
  !config.GOOGLE_CALLBACK_URL
) {
  throw new Error("Missing required Google OAuth environment variables");
}

passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
      passReqToCallback: true,
    },
    async (
      req: Request,
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: (error: any, user?: any) => void
    ) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const picture = profile.photos?.[0]?.value;
        const firstName = profile.name?.givenName;
        const lastName = profile.name?.familyName;

        if (!googleId || !email) {
          return done(
            new NotFoundException(
              "Google profile incomplete - missing email or ID"
            ),
            false
          );
        }

        const { user } = await loginOrCreateAccountService({
          provider: ProviderEnum.GOOGLE,
          firstName,
          lastName,
          providerId: googleId,
          picture,
          email,
        });

        if (!user.email_verified) {
          user.email_verified = true;
          await user.save();
        }

        done(null, user);
      } catch (error) {
        console.error("Google OAuth error:", error);
        done(error, false);
      }
    }
  )
);

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      session: true,
    },
    async (email: string, password: string, done) => {
      try {
        const user = await verifyUserService({ email, password });
        return done(null, user as unknown as Express.User);
      } catch (error: any) {
        return done(null, false, {
          message: error.message || "Authentication failed",
        });
      }
    }
  )
);

passport.serializeUser((user: Express.User, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await UserModel.findById(id).select("-password").lean().exec();

    if (!user) {
      return done(new NotFoundException("User not found"), null);
    }

    done(null, user as unknown as Express.User);
  } catch (err) {
    console.error("Deserialize user error:", err);
    done(err, null);
  }
});

export default passport;
