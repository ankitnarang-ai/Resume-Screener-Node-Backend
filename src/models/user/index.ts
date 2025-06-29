import mongoose, { Schema, Document } from "mongoose"; // Import Document
import { IUser } from "../../interfaces/user";
import bcrypt from "bcrypt";

// Extend IUser interface to include Google-specific fields
// This is important for TypeScript type safety throughout your app
export interface IGoogleUser extends IUser {
  googleId?: string; // Optional Google ID
  picture?: string;  // Optional profile picture URL
}

// Update the Schema definition to use IGoogleUser
const userSchema = new Schema<IGoogleUser>({ // Change IUser to IGoogleUser here
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
  },
  role: {
    type: String,
    enum: ["hr", "candidate"],
    default: "candidate"
  },
  isRegistered: {
    type: Boolean,
    default: false
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: false // *** KEY CHANGE 1: Make password optional ***
  },
  // *** KEY CHANGE 2: Add Google-specific fields ***
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows null values, but ensures uniqueness for non-null values
  },
  picture: {
    type: String
  }
}, {
  timestamps: true
});

// Modify isValidPassword to handle users without a password (Google users)
userSchema.methods.isValidPassword = async function(this: IGoogleUser, password: string): Promise<boolean> {
  const user = this;
  // If user doesn't have a password set (e.g., Google user), they can't validate a password
  if (!user.password) {
    return false;
  }
  return await bcrypt.compare(password, user.password);
}

// Ensure the exported User model uses the correct interface
export const User = mongoose.model<IGoogleUser>("User", userSchema); 