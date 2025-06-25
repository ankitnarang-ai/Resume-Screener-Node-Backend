import mongoose, { Schema } from "mongoose";
import { IInterview } from "../../interfaces/interview";

const interviewSchema = new Schema<IInterview>({
  _hr: {
    type: Schema.Types.ObjectId,
    required: true
  },
  _candidate: {
    type: Schema.Types.ObjectId,
    required: true
  },
  type: {
    type: String,
    enum: ["ai", "human"],
    default: "human"
  },
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled"],
    default: "scheduled"
  }
}, {
  timestamps: true
});

export const Interview = mongoose.model<IInterview>("Interview", interviewSchema);