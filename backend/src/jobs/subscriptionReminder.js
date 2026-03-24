import cron from 'node-cron';
import nodemailer from 'nodemailer';
import pool from '../db/pool.js';

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'projetofarmaciateste@gmail.com',
    pass: process.env.MAIL_SECRET,
  },
});

async function sendSubscriptionReminders() {
  try {
    const result = await pool.query(`
      SELECT nome, email FROM pesquisador
      WHERE is_enabled = TRUE
        AND is_admin = FALSE
        AND email != 'admin@admin.com'
        AND enabled_until::date = (NOW() + INTERVAL '7 days')::date
    `);

    for (const { nome, email } of result.rows) {
      await transporter.sendMail({
        from: 'NOME_DO_APP projetofarmaciateste@gmail.com',
        to: email,
        subject: 'Sua assinatura expira em 7 dias',
        text: `Olá, ${nome}!\n\nSua assinatura na plataforma expirará em 7 dias. Para continuar com acesso, entre em contato com um administrador para renovar sua contribuição.\n\nAtenciosamente,\nEquipe da Plataforma`,
      });
    }

    if (result.rows.length > 0) {
      console.log(`[subscriptionReminder] ${result.rows.length} lembrete(s) enviado(s).`);
    }
  } catch (err) {
    console.error('[subscriptionReminder] Erro ao enviar lembretes:', err);
  }
}

// Roda todo dia às 08:00
cron.schedule('0 8 * * *', sendSubscriptionReminders, {
  timezone: 'America/Sao_Paulo',
});

export default sendSubscriptionReminders;
