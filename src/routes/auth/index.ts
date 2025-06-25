import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middleware/auth";
import bcrypt from 'bcrypt';
import { User } from '../../models/user/index';
import jwt from "jsonwebtoken";

export const authRouter = Router();

authRouter.post("/public/signup", async (req: Request, res: Response) => {

  try {
    const { firstName, lastName, email, password, role } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    
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

    const token = jwt.sign({ id: user._id}, 'secret');

    // Generate JWT token
    res.cookie("token", token);

    res.send({
      message: "Login successful",
    });

  } catch (error) {
    res.status(400).send({
      message: error.message
    })
  }
  
});


/** Logout api */
authRouter.post("/public/logout", async (req: Request, res: Response) => {

  try {
    res.clearCookie('token');
    res.send('Logged out successfully');
  } catch (error) {
    res.status(400).send(`message : ${error.message}`);
  }
})

