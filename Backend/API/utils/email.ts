import { MailtrapClient } from 'mailtrap';

type PasswordResetEmailPayload = {
  to: string;
  nama: string;
  resetToken: string;
};

let client: MailtrapClient | null = null;

const getMailtrapClient = (token: string): MailtrapClient => {
  if (!client) {
    client = new MailtrapClient({ token });
  }

  return client;
};

export const sendPasswordResetEmail = async ({
  to,
  nama,
  resetToken,
}: PasswordResetEmailPayload): Promise<void> => {
  const mailtrapToken = process.env.MAILTRAP_TOKEN;

  if (!mailtrapToken) {
    throw new Error('MAILTRAP_TOKEN is required to send email via Mailtrap API');
  }

  const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
  const resetUrl = `${frontendBaseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const sender = {
    email: process.env.MAILTRAP_SENDER_EMAIL || 'hello@demomailtrap.co',
    name: process.env.MAILTRAP_SENDER_NAME || 'HBC App',
  };

  await getMailtrapClient(mailtrapToken).send({
    from: sender,
    to: [{ email: to }],
    subject: 'Password reset request',
    text: `Halo ${nama},\n\nKami menerima permintaan reset password untuk akun Anda. Silakan buka tautan berikut:\n${resetUrl}\n\nJika ini bukan Anda, abaikan email ini.`,
    html: `<p>Halo ${nama},</p><p>Kami menerima permintaan reset password untuk akun Anda.</p><p>Silakan buka tautan berikut:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Jika ini bukan Anda, abaikan email ini.</p>`,
    category: 'Password Reset',
  }).then(console.log, console.error);
};
