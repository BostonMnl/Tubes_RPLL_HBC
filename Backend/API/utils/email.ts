import nodemailer from 'nodemailer';

type PasswordResetEmailPayload = {
  to: string;
  nama: string;
  resetToken: string;
};

let transporter: nodemailer.Transporter | null = null;

const getSmtpTransporter = (): nodemailer.Transporter => {
  if (!transporter) {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !port || !user || !pass) {
      throw new Error('SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS are required to send email via SMTP');
    }

    const secure = process.env.SMTP_SECURE === 'true';

    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  return transporter;
};

export const sendPasswordResetEmail = async ({
  to,
  nama,
  resetToken,
}: PasswordResetEmailPayload): Promise<void> => {
  const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
  const resetUrl = `${frontendBaseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@example.com';
  const fromName = process.env.SMTP_FROM_NAME || 'HBC App';

  await getSmtpTransporter().sendMail({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject: 'Password reset request',
    text: `Halo ${nama},\n\nKami menerima permintaan reset password untuk akun Anda. Silakan buka tautan berikut:\n${resetUrl}\n\nJika ini bukan Anda, abaikan email ini.`,
    html: `<p>Halo ${nama},</p><p>Kami menerima permintaan reset password untuk akun Anda.</p><p>Silakan buka tautan berikut:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Jika ini bukan Anda, abaikan email ini.</p>`,
  });
};
