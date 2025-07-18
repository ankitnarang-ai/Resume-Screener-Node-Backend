import { NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../models/user';
import dotenv from 'dotenv';
dotenv.config();

export const authMiddleware = async (req: any, res: any, next: NextFunction) => {
    const token = req.cookies.token;
    
    try {
      if (!token) {
        throw new Error("Token not found");
      }
      
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
      if (!decoded) {
         throw new Error("Invalid token")
      }
  
      const user = await User.findById((decoded as any).id);
      
      if (!user) {
        throw new Error("User not found");
      }
      
      req.user = user;
      next();

    } catch (error) {
      res.status(401).send({
        message: "Unauthorized"
      })
    }
    
};