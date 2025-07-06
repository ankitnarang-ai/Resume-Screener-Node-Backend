import {Router, Request, Response} from "express";
import { authMiddleware } from "../../middleware/auth";
import { User } from "../../models/user";
import { log } from "console";
import { Hr } from "../../models/hr";


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

userRouter.put("/role", authMiddleware, async( req: any, res: Response) => {
  try {

    const { role} = req.body;
    const {firstName, lastName, email, _id} = req.user;

    const updatedUser = await User.findOneAndUpdate({_id}, {role: role}, {upsert: true, new: true});

    // ✅ If role is 'hr', create HR profile
    if (role === 'hr') {
      const hr = new Hr({
        _user: _id,
        firstName,
        lastName,
        email,
        resumeCount: 0
      });
      await hr.save();
    }

    

    res.send({
      message: 'User Role updated successfully',
      user: updatedUser
    })

  } catch (error) {
    res.status(400).send({
      message: error
    })
  }
})