import { Schema, model, Types, HydratedDocument } from 'mongoose';

export interface User {
    email: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
    email_verified?: boolean;
}

export interface UserDocument extends User {
    _id: Types.ObjectId;
    password?: string;
}

export interface LeanUser {
    _id: Types.ObjectId;
    email: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
    email_verified?: boolean;
}

const UserSchema = new Schema<UserDocument>({
    email: { type: String, required: true, unique: true },
    firstName: String,
    lastName: String,
    picture: String,
    email_verified: { type: Boolean, default: false },
    password: String,
});

const UserModel = model<UserDocument>('User', UserSchema);
export default UserModel;