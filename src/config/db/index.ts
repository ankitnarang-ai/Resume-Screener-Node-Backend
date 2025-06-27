import mongoose from 'mongoose'
import process from 'process'
export const connectDb = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string)
}