import mongoose, { Schema } from "mongoose";

const hrSchema = new Schema({
    _user: {
        type: Schema.Types.ObjectId,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
    },
    resumeCount: {
        type: Number,
        default: 0
    },
    candidateMatched: {
        type: Number,
        default: 0
    },
    interviewInvitation: {
        type: Number,
        default: 0
    },
    interviewRejection: {
        type: Number,
        default: 0
    },
    aiInterviewCompleted: {
        type: Number,
        default: 0
    },
    humanInterviewCompleted: {
        type: Number,
        default: 0
    },
},
{
  timestamps: true
})

export const Hr = mongoose.model("Hr", hrSchema); 
