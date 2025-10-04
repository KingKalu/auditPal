
import { CorsOptions } from 'cors';
import { config } from './app.config';

export const corsConfig: CorsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = config.CORS_ORIGIN.split(',').map(o => o.trim());

        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400, 
};
