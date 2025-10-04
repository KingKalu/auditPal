import { UserDocument, LeanUser } from '../models/user.model'; // adjust path as needed

declare global {
  namespace Express {
    interface User extends LeanUser { }

    interface Request {
      user?: UserDocument;
    }
  }
}

export { };