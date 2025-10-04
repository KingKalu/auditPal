import session from "express-session";
import MongoStore from "connect-mongo";
import { config } from "./app.config";

const isProduction = config.NODE_ENV === "production";

export const sessionConfig: session.SessionOptions = {
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: config.MONGO_URI,
        collectionName: "sessions",
        ttl: 7 * 24 * 60 * 60, // 7 days
        autoRemove: "native",
        touchAfter: 24 * 3600, // Lazy session update (24 hours)
    }),
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        // domain: config.COOKIE_DOMAIN || undefined,
        path: "/",
    },
    name: "sessionId",
    // proxy: isProduction, // Trust first proxy
    rolling: true, // Reset maxAge on every response
};
