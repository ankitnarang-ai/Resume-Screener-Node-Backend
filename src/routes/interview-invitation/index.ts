import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { interviewInvitationHandler } from "../../controllers/interview-invitation";

export const interviewRouter = Router();

interviewRouter.post("/invite" , authMiddleware, interviewInvitationHandler);