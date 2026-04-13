import crypto from 'crypto';

type PasswordResetEntry = {
  userId: string;
  expiresAt: number;
};

const passwordResetStore = new Map<string, PasswordResetEntry>();
const tokenTtlMinutes = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 15);

const cleanupExpiredTokens = () => {
  const now = Date.now();
  for (const [token, entry] of passwordResetStore.entries()) {
    if (entry.expiresAt <= now) {
      passwordResetStore.delete(token);
    }
  }
};

export const createPasswordResetToken = (userId: string): string => {
  cleanupExpiredTokens();

  const token = crypto.randomBytes(32).toString('hex');
  passwordResetStore.set(token, {
    userId,
    expiresAt: Date.now() + tokenTtlMinutes * 60 * 1000,
  });

  return token;
};

export const consumePasswordResetToken = (token: string): string | null => {
  cleanupExpiredTokens();

  const entry = passwordResetStore.get(token);
  if (!entry) {
    return null;
  }

  passwordResetStore.delete(token);

  if (entry.expiresAt <= Date.now()) {
    return null;
  }

  return entry.userId;
};
