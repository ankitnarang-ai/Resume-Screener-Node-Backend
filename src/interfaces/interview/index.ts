import { Types } from "mongoose";

// Enum for interview status
export type InterviewStatus = 'active' | 'complete' | 'expired' | 'inactive';

// Single interview object
export interface Interview {
  company?: string;
  jobDescription: string;
  expireAt?: Date;
  duration?: number;
  status: InterviewStatus;
}

export interface IInterview {
  _id: Types.ObjectId;
  _hr: Types.ObjectId; 
  _candidate: Types.ObjectId;
  interviewDetails: Interview;
}

export interface InviteBody {
  candidateEmail: string;
  candidateName: string;
  hrId: string;
  interviewType: "ai" | "human";
}