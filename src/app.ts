import express, {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth";
import { userRouter } from "./routes/user";
import { interviewRouter } from "./routes/interview-invitation";

dotenv.config();

export const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/authentication", authRouter);
app.use("/user", userRouter);
app.use("/interview", interviewRouter);

/** Global Error handling */
app.use( "/", ( error: ErrorRequestHandler, req: Request, res: Response, next: NextFunction ) => {
    if (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);
