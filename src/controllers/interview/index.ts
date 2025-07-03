import { Request, Response } from "express";
import { User } from "../../models/user";
import { Interview } from "../../models/interview";
import mongoose from "mongoose";
import { Roles, InterviewType, InterviewStatus } from "../../constants/enum";
import { sendInterviewInvite } from "../../Utils/email";
import { Hr } from "../../models/hr";

// Interview invitation handler
export const interviewInvitationHandler = async (
  req: any,
  res: Response
) => {

  const hrId = req.user._id; // Get HR ID from authenticated user

  const { candidateEmail, candidateName, interviewType } = req.body;

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

      if(candidate.role === 'hr') {
        throw new Error("Cannot invite an HR as a candidate");
      }

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

      console.log("hrid", hrId);
      

      await Hr.findOneAndUpdate(
        { _user: hrId },
        { $inc: { interviewInvitation: 1 } },
        { new: true, useFindAndModify: false, session }
      );
    });

    res.status(201).json({
      message: "Interview invitation created",
      interviewId: interviewDoc[0]._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

// Interview rejection handler
export const interviewRejectionHandler = async (
  req: any,
  res: Response
) => {

  const hrId = req.user._id; // Get HR ID from authenticated user

  const { candidateEmail, candidateName } = req.body;

  // Body already validated by middleware at this point

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
     
      // Enqueue email
     await sendInterviewInvite({
        to: candidateEmail,
        name: candidateEmail,
        subject: "You're Invited for an Interview",
        message: `Hi ${candidateName},<br><br>Sorry this time we are not proceed with your application<b>`
      });
      
      await Hr.findOneAndUpdate(
        { _user: hrId },
        { $inc: { interviewRejection: 1 } },
        { new: true, useFindAndModify: false, session }
      );
    });

    res.status(201).json({
      message: "Interview rejection created",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not create interview rejection" });
  } finally {
    session.endSession();
  }
};