import {Router, Request, Response} from "express";
import { authMiddleware } from "../../middleware/auth";


export const userRouter = Router();

userRouter.get("/profile", authMiddleware, async ( req: any, res: Response) => {
  
  try {
    const user = req.user;

    if (!user) {
      throw new Error("User not found");
    }

    res.send({
      message: "User profile",
      user: user
    })
   
  } catch(error) {

    res.status(400).send({
      message: error.message,
    });
  }
})