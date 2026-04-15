import nodemailer from 'nodemailer';
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';

const MAIL_SECRET = process.env.MAIL_SECRET;

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: MAIL_SECRET
  }
});

router.post('/send-email', authMiddleware, async (req, res) => {
  const { recipientEmail, subject, body } = req.body;

  const mailOptions = {
    from: `ConectaFarmaco <${process.env.MAIL_USER}>`,
    to: recipientEmail,
    subject: subject,
    text: body
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    res.status(200).json({ message: 'E-mail enviado com sucesso!' });
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    res.status(500).json({ error: 'Falha ao enviar e-mail.' });
  }
});

export default router;
