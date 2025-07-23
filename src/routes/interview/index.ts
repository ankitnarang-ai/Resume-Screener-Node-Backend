import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { getInterviews, interviewInvitationHandler, interviewRejectionHandler } from "../../controllers/interview";
import { pagination } from "../../middleware/pagination";

export const interviewRouter = Router();

interviewRouter.post("/invite" , authMiddleware, interviewInvitationHandler);

interviewRouter.post("/reject", authMiddleware, interviewRejectionHandler);

// Get all the interviews for particular user Id
interviewRouter.get("/get-interviews/:id", authMiddleware, pagination, getInterviews)