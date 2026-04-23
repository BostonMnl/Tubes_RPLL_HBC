import nodemailer from 'nodemailer';

type PasswordResetEmailPayload = {
  to: string;
  nama: string;
  resetToken: string;
};

let transporter: nodemailer.Transporter | null = null;

const createTransporter = (): nodemailer.Transporter => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

const getTransporter = (): nodemailer.Transporter => {
  if (!transporter) {
    transporter = createTransporter();
  }

  return transporter;
};

export const sendPasswordResetEmail = async ({
  to,
  nama,
  resetToken,
}: PasswordResetEmailPayload): Promise<void> => {
  const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
  const resetUrl = `${frontendBaseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const from = process.env.SMTP_FROM || 'no-reply@hbc.local';

  await getTransporter().sendMail({
    from,
    to,
    subject: 'Password reset request',
    text: `Halo ${nama},\n\nKami menerima permintaan reset password untuk akun Anda. Silakan buka tautan berikut:\n${resetUrl}\n\nJika ini bukan Anda, abaikan email ini.`,
    html: `<p>Halo ${nama},</p><p>Kami menerima permintaan reset password untuk akun Anda.</p><p>Silakan buka tautan berikut:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Jika ini bukan Anda, abaikan email ini.</p>`,
  });
};
