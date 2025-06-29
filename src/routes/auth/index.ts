import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middleware/auth";
import bcrypt from 'bcrypt';
import { User } from '../../models/user/index';
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { request } from "http";

export const authRouter = Router();

// Initialize Google OAuth2Client with your GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
  console.error("GOOGLE_CLIENT_ID is not defined in environment variables!");
  // In a real app, you might want to throw an error or exit if this is critical
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

authRouter.post('/public/google', async (req: Request, res: Response): Promise<void> => {
  const { token: idToken } = req.body; // Renaming 'token' to 'idToken' for clarity


  console.log("request received for Google auth"); // More descriptive log
  
  if (!idToken) {
    res.status(400).json({ message: 'Google ID token is missing.' });
    return;
  }

  try {
    // Verify the Google ID Token
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID, // Ensure the token's audience matches your Client ID
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      throw new Error("Invalid Google token payload");
    }

    const googleId = payload.sub; // Google's unique user ID
    const email = payload.email;
    const firstName = payload.given_name || payload.name; // Use given_name, fallback to full name
    const lastName = payload.family_name || ''; // Use family_name
    const picture = payload.picture; // Profile picture URL

    // --- User Management Logic (Integrate with your User Model) ---
    let user = await User.findOne({ email });

    if (!user) {
      // If user doesn't exist, create a new one with 'hr' role
      user = new User({
        googleId: googleId, // Store Google ID for future lookups
        firstName,
        lastName,
        email,
        picture, // Store profile picture URL
        role: 'hr', // Set role to 'hr' for newly created Google users
      });

      await user.save();
      console.log('New user registered via Google with HR role:', user.email);
    } else {
      // User exists, check if they previously logged in via Google
      if (!user.googleId) {
        // Link existing user account to Google ID if not already linked
        user.googleId = googleId;
        user.picture = picture; // Update picture if it changed
        await user.save();
        console.log('Existing user linked to Google:', user.email);
      }
      console.log('Existing user logged in via Google:', user.email);
    }

    // --- Generate Your Application's JWT ---
    // The token payload should contain enough info to identify the user in your system
    const appToken = jwt.sign(
      { id: user._id, email: user.email, googleId: user.googleId }, // Use user._id from your DB
      process.env.JWT_SECRET || 'fallback-secret-for-dev',
      { expiresIn: isProduction ? "15m" : "24h" } // Your app's token expiry
    );

    // Set your app's JWT in an HttpOnly cookie
    res.cookie("token", appToken, COOKIE_OPTIONS);

    res.status(200).json({
      message: 'Google authentication successful',
      user: {
        id: user._id, // Send back your internal user ID
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        picture: user.picture,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error('Error during Google authentication:', error.message);
    res.status(401).json({
      message: isProduction ? "Google authentication failed" : `Google authentication failed: ${error.message}`
    });
  }
});

// Add token verification endpoint
authRouter.get("/verify-token", authMiddleware, async (req: Request, res: Response) => {
  try {

    console.log("enter");
    
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