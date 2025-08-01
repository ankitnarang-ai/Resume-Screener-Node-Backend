// This file is used to send emails using Brevo (formerly SendinBlue) API.
import SibApiV3Sdk from 'sib-api-v3-sdk';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.BREVO_API_KEY as String; 

const senderEmail = 'ankitnarang255@gmail.com'; 

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKeyInstance = defaultClient.authentications['api-key'];
apiKeyInstance.apiKey = apiKey;

export const sendInterviewInvite = async ({
  to,
  name,
  subject,
  message
}: {
  to: string;
  name: string;
  subject: string;
  message: string;
}) => {
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  const sendSmtpEmail = {
    to: [{ email: to, name }],
    sender: { email: senderEmail, name: 'Hire Catalyze' },
    subject,
    htmlContent: `<html><body><p>${message}</p></body></html>`
  };

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return response;
  } catch (error) {
    console.error("❌ Failed to send email:", error.response?.body || error.message || error);
    throw new Error('Email sending failed');
  }
};
