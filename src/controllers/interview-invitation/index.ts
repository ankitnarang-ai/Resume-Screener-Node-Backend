import { Request, Response } from "express";
import { User } from "../../models/user";
import { Interview } from "../../models/interview";
import mongoose from "mongoose";
import { Roles, InterviewType, InterviewStatus } from "../../constants/enum";
import { InviteBody } from "../../interfaces/interview";
import { sendInterviewInvite } from "../../Utils/email";
export const interviewInvitationHandler = async (
  req: Request<{}, {}, InviteBody>,
  res: Response
) => {
  const { candidateEmail, candidateName, hrId, interviewType } = req.body;

  // Body already validated by middleware at this point

  const session = await mongoose.startSession();
  let interviewDoc;

  try {
    await session.withTransaction(async () => {
      // Upsert candidate
      const candidate = await User.findOneAndUpdate(
        { email: candidateEmail },
        {
          $setOnInsert: {
            firstName: candidateName,
            role: Roles.CANDIDATE,
            isRegistered: false,
            password: "Test@123"
          }
        },
        { new: true, upsert: true, session }
      );

      // Create interview
      interviewDoc = await Interview.create(
        [
          {
            _hr: hrId,
            _candidate: candidate._id,
            status: InterviewStatus.SCHEDULED,
            type: interviewType as InterviewType
          }
        ],
        { session }
      );

      // Enqueue email
     await sendInterviewInvite({
        to: candidate.email,
        name: candidate.firstName,
        subject: "You're Invited for an Interview",
        message: `Hi ${candidate.firstName},<br><br>You have been scheduled for a <b>${interviewType}</b> interview.<br><br>Good luck!`
      });
    });

    res.status(201).json({
      message: "Interview invitation created",
      interviewId: interviewDoc[0]._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not create interview invitation" });
  } finally {
    session.endSession();
  }
};
