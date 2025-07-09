import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middleware/auth";
import bcrypt from 'bcrypt';
import { User } from '../../models/user/index';
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import dotenv from 'dotenv';
dotenv.config();

export const authRouter = Router();

// Initialize Google OAuth2Client with your GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
  throw new Error("❌ GOOGLE_CLIENT_ID must be set in production!");
}
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const isProduction = process.env.NODE_ENV === "production";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction, // HTTPS-only in production
  sameSite: isProduction ? "none" as "none" : "lax" as "lax",
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/'
};

authRouter.post("/public/signup", async (req: any, res: any) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // ✅ Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists with this email" });
    }

    // ✅ Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // ✅ Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password: passwordHash
    });

    await user.save(); // Save user

    // ✅ Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: isProduction ? "15m" : "24h" }
    );

    // ✅ Set auth cookie
    res.cookie("token", token, COOKIE_OPTIONS);

    // ✅ Send success response
    return res.status(201).json({
      message: "User created and logged in",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("❌ Signup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/** Login api */
authRouter.post("/public/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordValid = await user.isValidPassword(password);

    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'fallback-secret-for-dev', // Always have a fallback
      { expiresIn: isProduction ? "12h" : "24h" } // Shorter expiry in production
    );

    // Set cookie with proper options for cross-origin requests
    res.cookie("token", token, {
      ...COOKIE_OPTIONS, // Use the config object you already defined
      secure: isProduction, // Dynamic based on environment
      sameSite: isProduction ? 'none' : 'lax' // Required for cross-site in production
    });

    res.send({
      message: "Login successful",
    });

  } catch (error) {
    res.status(400).send({
      message: isProduction ? "Authentication failed" : error.message
    });

  }

});

/** Logout api */
authRouter.post("/public/logout", async (req: Request, res: Response) => {

  try {
    // Clear cookie with same options as when set
    res.clearCookie('token', {
      httpOnly: true, // Should match
      secure: isProduction, // THIS IS CRITICAL - MUST MATCH THE SETTING
      sameSite: isProduction ? 'none' : 'lax', // THIS IS CRITICAL - MUST MATCH THE SETTING
      path: '/' // Should match
  });

    res.send('Logged out successfully');
  } catch (error) {
    res.status(400).send(`message : ${error.message}`);
  }
})

authRouter.post('/public/google-signup', async (req: Request, res: any): Promise<void> => {
  const { token: idToken } = req.body;

  if (!idToken) {
    res.status(400).json({ message: 'Google ID token is missing.' });
    return;
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      throw new Error("Invalid Google token payload");
    }

    const googleId = payload.sub;
    const email = payload.email;

    // ❌ If user already exists, don't signup
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const user = new User({
      googleId,
      email,
      firstName: payload.given_name || payload.name,
      lastName: payload.family_name || '',
      picture: payload.picture,
      role: 'hr'
    });

    await user.save();

    const appToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret-for-dev',
      { expiresIn: isProduction ? "15m" : "24h" }
    );

    res.cookie("token", appToken, COOKIE_OPTIONS);

    res.status(201).json({
      message: "Google signup successful",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        picture: user.picture,
        role: user.role
      }
    });

  } catch (error: any) {
    res.status(401).json({ message: "Google signup failed" });
  }
});

authRouter.post('/public/google-login', async (req: Request, res: any): Promise<void> => {
  const { token: idToken } = req.body;

  if (!idToken) {
    res.status(400).json({ message: 'Google ID token is missing.' });
    return;
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      throw new Error("Invalid Google token payload");
    }

    const googleId = payload.sub;
    const email = payload.email;

    const user = await User.findOne({ email });

    // ❌ If user doesn't exist, don't allow login
    if (!user) {
      return res.status(404).json({ message: "No user found with this Google account" });
    }

    // ✅ If user exists but has no googleId, link it
    if (!user.googleId) {
      user.googleId = googleId;
      user.picture = payload.picture;
      await user.save();
    }

    // ✅ Create app token
    const appToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret-for-dev',
      { expiresIn: isProduction ? "15m" : "24h" }
    );

    res.cookie("token", appToken, COOKIE_OPTIONS);

    res.status(200).json({
      message: "Google login successful",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        picture: user.picture,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error('Google login error:', error.message);
    res.status(401).json({ message: "Google login failed" });
  }
});

// Add token verification endpoint
authRouter.get("/verify-token", authMiddleware, async (req: any, res: any) => {
  try {

    console.log("enter");
    
    // If middleware passes, token is valid
    res.send({
      message: "Token is valid",
      valid: true,
      user: req.user 
    });
  } catch (error) {
    res.status(401).send({
      message: "Token is invalid",
      valid: false
    });
  }
});