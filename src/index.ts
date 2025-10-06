import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import session from "cookie-session";
import { config } from "./config/app.config";
import connectDatabase from "./config/database.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { BadRequestException } from "./utils/appError";
import { ErrorCodeEnum } from "./enums/error-code.enum";

import "./config/passport.config";
import passport from "passport";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import isAuthenticated from "./middlewares/isAuthenticated.middleware";

const app = express();
const BASE_PATH = config.BASE_PATH;

app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: "session",
    keys: [config.SESSION_SECRET],
    maxAge: 10 * 60 * 1000,
    httpOnly: true,
    sameSite: "none",
    secure: config.NODE_ENV === "production",
  })
);

// Middleware to add the Partitioned flag to cookies
app.use((req: Request, res: Response, next: NextFunction) => {
  const header = res.getHeader("Set-Cookie");

  if (!header) return next();

  // Convert the header into a string array only
  const cookieArray: string[] = Array.isArray(header)
    ? header.filter((item): item is string => typeof item === "string")
    : typeof header === "string"
    ? [header]
    : [];

  // Ensure all cookies include the Partitioned flag
  const updatedCookies: string[] = cookieArray.map((cookie) =>
    cookie.includes("Partitioned") ? cookie : `${cookie}; Partitioned`
  );

  // Set the updated cookies back
  res.setHeader("Set-Cookie", updatedCookies);

  next();
});

app.use(passport.initialize());
app.use(passport.session());

app.use(
  cors({
    origin: config.FRONTEND_ORIGIN?.split(",") || [],
    credentials: true,
  })
);

app.get(
  "/",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    throw new BadRequestException(
      "This is a bad request",
      ErrorCodeEnum.AUTH_USER_NOT_FOUND
    );
  })
);

app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/user`, isAuthenticated, userRoutes);

app.use(errorHandler);

app.listen(config.PORT, async () => {
  console.log(`Server listening on port ${config.PORT} in ${config.NODE_ENV}`);
  await connectDatabase();
});
