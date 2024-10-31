import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });
    }

    async sendEmail(to: string, subject: string, text: string) {
        const mailOptions = {
            from: `"Your Name" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
            html: `<h1>${text}</h1>`, 
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent:', info);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }
}