import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middleware/auth";
import bcrypt from 'bcrypt';
import { User } from '../../models/user/index';
import jwt from "jsonwebtoken";

export const authRouter = Router();

const isProduction = process.env.NODE_ENV === "production";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction, // HTTPS-only in production
  sameSite: isProduction ? "none" as "none" : "lax" as "lax",
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/'
};

authRouter.post("/public/signup", async (req: Request, res: Response) => {

  try {
    const { firstName, lastName, email, password, role } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);

    const user = new User({
      firstName,
      lastName,
      email,
      role,
      password: passwordHash
    })

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    await user.save();
    res.send({
      message: "User created successfully",
    });
  } catch (error) {
    res.status(400).send({
      message: "Error creating user",
    });
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
      { expiresIn: isProduction ? "15m" : "24h" } // Shorter expiry in production
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
    res.clearCookie('token', COOKIE_OPTIONS);

    res.send('Logged out successfully');
  } catch (error) {
    res.status(400).send(`message : ${error.message}`);
  }
})

// Add token verification endpoint
authRouter.get("/verify-token", authMiddleware, async (req: Request, res: Response) => {
  try {
    // If middleware passes, token is valid
    res.send({
      message: "Token is valid",
      valid: true
    });
  } catch (error) {
    res.status(401).send({
      message: "Token is invalid",
      valid: false
    });
  }
});