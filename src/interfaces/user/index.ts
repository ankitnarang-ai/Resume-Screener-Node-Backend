import { Document } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName?: string;
  role: "hr" | "candidate";
  email: string;
  password: string;
  isRegistered?: boolean;
  isValidPassword(password: string): Promise<boolean>;
}