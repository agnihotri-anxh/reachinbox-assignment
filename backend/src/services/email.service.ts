import nodemailer from 'nodemailer';
import { config } from '../config/env';

let transporter: nodemailer.Transporter | null = null;

export async function getEmailTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) {
    return transporter;
  }

  // If Ethereal credentials are not set, create a test account
  if (!config.email.etherealUser || !config.email.etherealPass) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('Ethereal Email credentials created:');
    console.log('User:', testAccount.user);
    console.log('Pass:', testAccount.pass);
  } else {
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: config.email.etherealUser,
        pass: config.email.etherealPass,
      },
    });
  }

  return transporter;
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<{ messageId: string; previewUrl?: string }> {
  const transporter = await getEmailTransporter();

  const mailOptions = {
    from: (transporter.options as any).auth?.user || 'noreply@example.com',
    to,
    subject,
    html: body,
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);

  return {
    messageId: info.messageId,
    previewUrl: previewUrl || undefined,
  };
}