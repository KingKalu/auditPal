

import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import passport from "passport";
import mongoose from "mongoose";
import { config } from "./config/app.config";
import connectDatabase from "./config/database.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { NotFoundException } from "./utils/appError";

import "./config/passport.config";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import { isAuthenticated } from "./middlewares/isAuthenticated.middleware";


const app = express();
const BASE_PATH = config.BASE_PATH;



app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: config.NODE_ENV === "production",
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(mongoSanitize());



app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser()); // ADD THIS - Must come before session



const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    const allowedOrigins =
      config.FRONTEND_ORIGIN?.split(",").map((o) => o.trim()) || [];

    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(
        new Error(
          `Origin ${origin} not allowed by CORS. Allowed: ${allowedOrigins.join(", ")}`
        )
      );
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
  maxAge: 86400,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));


app.use(
  session({
    name: "sessionId",
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: config.MONGO_URI,
      collectionName: "sessions",
      ttl: 24 * 60 * 60,
      autoRemove: "native",
      touchAfter: 24 * 3600,
      crypto: {
        secret: config.SESSION_SECRET,
      },
    }),
    cookie: {
      secure: config.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: config.NODE_ENV === "production" ? "none" : "lax",
      // domain: config.COOKIE_DOMAIN || undefined,
      path: "/",
    },
  })
);



app.use(passport.initialize());
app.use(passport.session());


if (config.NODE_ENV === "development") {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log("Session ID:", req.sessionID);
    console.log("Authenticated:", req.isAuthenticated());
    console.log("User:", req.user?._id || "Not authenticated");
    console.log("Cookies:", req.cookies);
    next();
  });
}


app.get("/health", (req: Request, res: Response) => {
  res.status(HTTPSTATUS.OK).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
    session: {
      authenticated: req.isAuthenticated(),
      sessionID: req.sessionID,
    },
  });
});

app.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    res.status(HTTPSTATUS.OK).json({
      message: "AuditPal API is running",
      version: "1.0.0",
      endpoints: {
        auth: `${BASE_PATH}/auth`,
        user: `${BASE_PATH}/user`,
        health: "/health",
      },
    });
  })
);

app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/user`, isAuthenticated, userRoutes);



app.use((req: Request, res: Response, next: NextFunction) => {
  throw new NotFoundException(
    `Route ${req.method} ${req.originalUrl} not found`
  );
});


app.use(errorHandler);


const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    console.log("HTTP server closed");

    try {
      await mongoose.connection.close();
      console.log("Database connection closed");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

let server: any;

const startServer = async () => {
  try {
    await connectDatabase();
    console.log("✅ Database connected successfully");

    server = app.listen(config.PORT, () => {
      console.log("\n" + "=".repeat(50));
      console.log(`AuditPal Server is running`);
      console.log(`Environment: ${config.NODE_ENV}`);
      console.log(`Port: ${config.PORT}`);
      console.log(`Base Path: ${BASE_PATH}`);
      console.log(`Secure Cookies: ${config.NODE_ENV === "production"}`);
      console.log("=".repeat(50) + "\n");

      if (config.NODE_ENV === "development") {
        console.log("Available Routes:");
        console.log(`   GET  http://localhost:${config.PORT}/`);
        console.log(`   GET  http://localhost:${config.PORT}/health`);
        console.log(`   POST http://localhost:${config.PORT}${BASE_PATH}/auth/register`);
        console.log(`   POST http://localhost:${config.PORT}${BASE_PATH}/auth/login`);
        console.log(`   POST http://localhost:${config.PORT}${BASE_PATH}/auth/forgot-password`);
        console.log(`   GET  http://localhost:${config.PORT}${BASE_PATH}/auth/reset-password/:token`);
        console.log(`   POST http://localhost:${config.PORT}${BASE_PATH}/auth/reset-password`);
        console.log(`   GET  http://localhost:${config.PORT}${BASE_PATH}/auth/google`);
        console.log(`   POST http://localhost:${config.PORT}${BASE_PATH}/auth/logout\n`);
      }
    });

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    process.on("uncaughtException", (error) => {
      console.error("Uncaught Exception:", error);
      gracefulShutdown("UNCAUGHT_EXCEPTION");
    });

    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
      gracefulShutdown("UNHANDLED_REJECTION");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
