import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { interviewInvitationHandler, interviewRejectionHandler } from "../../controllers/interview";

export const interviewRouter = Router();

interviewRouter.post("/invite" , authMiddleware, interviewInvitationHandler);
// interviewRouter.post("/invite" , interviewInvitationHandler);

interviewRouter.post("/reject", authMiddleware, interviewRejectionHandler);
// interviewRouter.post("/reject", interviewRejectionHandler);