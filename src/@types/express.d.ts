import type { Types } from 'mongoose';

declare global {
    namespace Express {
        interface User {
            _id: Types.ObjectId;
            email: string;
            firstName?: string;
            lastName?: string;
            picture?: string;
            email_verified?: boolean;
           
        }
    }
}