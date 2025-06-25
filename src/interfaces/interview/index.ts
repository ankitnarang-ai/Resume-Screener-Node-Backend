import { Types } from "mongoose";

export interface IInterview {
  _id: Types.ObjectId;
  _hr: Types.ObjectId; 
  _candidate: Types.ObjectId;
  type: "ai" | "human";
  status: "scheduled" | "completed" | "cancelled";
}

export interface InviteBody {
  candidateEmail: string;
  candidateName: string;
  hrId: string;
  interviewType: "ai" | "human";
}