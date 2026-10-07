import nodemailer from 'nodemailer';
import express from 'express';
import rateLimit from 'express-rate-limit';
import authMiddleware from '../middleware/authMiddleware.js';

const MAIL_SECRET = process.env.MAIL_SECRET;

const router = express.Router();

const mailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas mensagens enviadas. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user.id),
});

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: MAIL_SECRET
  }
});

router.post('/send-email', authMiddleware, mailLimiter, async (req, res) => {
  const { recipientEmail, subject, body } = req.body;

  if (!recipientEmail || !subject || !body) {
    return res.status(400).json({ error: 'Destinatário, assunto e corpo são obrigatórios.' });
  }

  const senderEmail = req.user.email;

  const mailOptions = {
    from: `ConectaFarmaco <${process.env.MAIL_USER}>`,
    to: recipientEmail,
    replyTo: senderEmail,
    subject: subject,
    text: `${body}\n\n---\nEnviado por: ${senderEmail}\nVocê pode responder diretamente para este endereço.`
  };

  const receiptOptions = {
    from: `ConectaFarmaco <${process.env.MAIL_USER}>`,
    to: senderEmail,
    subject: `[Recibo] ${subject}`,
    text: `Recibo: cópia do e-mail que você enviou para ${recipientEmail}.\n\n---\n\n${body}`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return res.status(500).json({ error: 'Falha ao enviar e-mail.' });
  }

  try {
    await transporter.sendMail(receiptOptions);
  } catch (error) {
    console.error('Erro ao enviar recibo:', error);
    return res.status(200).json({ message: 'E-mail enviado com sucesso, mas o recibo não pôde ser enviado.' });
  }

  res.status(200).json({ message: 'E-mail enviado com sucesso!' });
});

export default router;
