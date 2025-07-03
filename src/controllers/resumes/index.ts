
import axios from 'axios';
import FormData from 'form-data';
import { Hr } from '../../models/hr';
import dotenv from 'dotenv';
dotenv.config();

export const resumeUploadAndProcess = async (req: any, res: any) => {

    try {

        const hrId = req?.user?._id.toString();

        if (!hrId) {
            return res.status(400).json({ error: 'HR ID is required' });
        }

        // Check if files are provided
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files provided' });
        }

        await Hr.findOneAndUpdate(
            { _user: hrId }, { $inc: { resumeCount: req.files.length } },
            { new: true, useFindAndModify: false }
        );

        const form = new FormData();

        // Append each file to form-data
        req.files.forEach((file: any) => {
            form.append('files', file.buffer, file.originalname);
        });

        // Send the files to Python FastAPI
        const response = await axios.post(`${process.env.PYTHON_URL}/upload-and-process`, form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        res.json({
            message: 'Files sent to Python!',
            result: response.data
        });
    } catch (err) {
        res.status(400).json({ 
            error: err.message || 'An error occurred while processing the request'
        });
    }
}

export const chatWithResume = async (req: any, res: any) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400)
                .json({ error: 'Question and resumeId are required' });
        }

        // Send the question and resumeId to Python FastAPI
        const response = await axios.post(`${process.env.PYTHON_URL}/ask`, {
            question
        });

        console.log("Response from Python:", response.data);
        
        await Hr.findOneAndUpdate(
            { _user: req.user._id },
            { $inc: { candidateMatched: response.data?.answer?.total | 0 } },
            { new: true, useFindAndModify: false }
        );

        res.json(
            response.data
        );
    } catch (err) {
        res.status(400).json({ 
            error: err.message || 'An error occurred while processing the request'
        });
    }
}