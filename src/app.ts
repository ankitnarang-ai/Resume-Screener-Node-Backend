import express, {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import http from 'http'
import cookieParser from "cookie-parser";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { userRouter } from "./routes/user";
import { interviewRouter } from "./routes/interview";
import morgan from 'morgan';
import { resumeUploadAndProcess } from "./controllers/resumes";
import { resumeRouter } from "./routes/resumes";
import { initWebsocket } from "./websocket";

export const app = express();

export const httpServer = http.createServer(app);
initWebsocket(httpServer) // Because websocket needs protocol which express can't provide so we create http server from it we creawte web socket server.

// Improved CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // For development, allow all origins
    // In production, specify exact origins like ['http://localhost:4200', 'https://yourdomain.com']
    const allowedOrigins = [
      'http://localhost:4200',
      'http://localhost:3000',
      'http://127.0.0.1:4200',
      'http://127.0.0.1:3000',
      'http://localhost:8000',
      'https://app.shortcomponents4u.com',
      'https://app.hirecatalyze.com'
    ];
    
    // For development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // For production, check against allowed origins
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

app.use(morgan('dev'));

// Important: Add cookie parser before routes
app.use(cookieParser());
app.use(express.json());

app.use("/authentication", authRouter);
app.use("/user", userRouter);
app.use("/interview", interviewRouter);
app.use("/resume", resumeRouter);

/** Global Error handling */
app.use( "/", ( error: ErrorRequestHandler, req: Request, res: Response, next: NextFunction ) => {
    if (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);