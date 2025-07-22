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
  interviewDetails: 
    {
      company: {
        type: String,
        required: false 
      },
      jobDescription: {
        type: String,
        required: true
      },
      expireAt: {
        type: Date,
        required: false
      },
      duration: {
        type: Number,
        required: false
      },
      status: {
        type: String,
        enum: ['active' , 'complete' , 'expired' , 'inactive'],
        required: true,
        default: 'inactive'
      }
    }
  
}, {
  timestamps: true
});

export const Interview = mongoose.model<IInterview>("Interview", interviewSchema);