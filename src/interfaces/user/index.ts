import { Document, Types } from "mongoose";

// User document with embedded interviews
export interface IUser extends Document {
  firstName: string;
  lastName?: string;
  role: 'hr' | 'candidate';
  email: string;
  password: string;
  isRegistered?: boolean;
  isValidPassword(password: string): Promise<boolean>;
}
