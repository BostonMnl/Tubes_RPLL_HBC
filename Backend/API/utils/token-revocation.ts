import { Request } from 'express';

const revokedTokens = new Map<string, number>();

const nowInSeconds = (): number => Math.floor(Date.now() / 1000);

const purgeExpiredRevokedTokens = (): void => {
  const now = nowInSeconds();
  for (const [token, exp] of revokedTokens.entries()) {
    if (exp <= now) {
      revokedTokens.delete(token);
    }
  }
};

export const extractTokenFromRequest = (req: Request): string | null => {
  const authHeader = req.header('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  const legacyToken = req.header('x-auth-token');
  if (legacyToken && legacyToken.trim().length > 0) {
    return legacyToken.trim();
  }

  return null;
};

export const revokeToken = (token: string, exp: number): void => {
  purgeExpiredRevokedTokens();
  revokedTokens.set(token, exp);
};

export const isTokenRevoked = (token: string): boolean => {
  purgeExpiredRevokedTokens();
  return revokedTokens.has(token);
};
