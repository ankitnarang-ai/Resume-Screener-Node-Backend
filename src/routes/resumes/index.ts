import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { chatWithResume, resumeUploadAndProcess } from "../../controllers/resumes";
import multer from 'multer';
import { resumeAnalytics } from "../../controllers/analytics";

const storage = multer.memoryStorage();
const upload = multer({storage});

export const resumeRouter = Router();

resumeRouter.post('/upload-process', authMiddleware, upload.array('files'), resumeUploadAndProcess);

resumeRouter.post('/ask', authMiddleware, chatWithResume);

resumeRouter.get('/analytics', authMiddleware, resumeAnalytics);