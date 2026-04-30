// JWT Token Management Utilities

export interface DecodedToken {
  id: string;
  email: string;
  nama: string;
  role: string;
  iat: number;
  exp: number;
}

// Decode JWT token (base64 decode, tidak verify signature)
export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad) {
      base64 += '='.repeat(4 - pad);
    }

    const decoded = JSON.parse(atob(base64));
    return decoded;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  
  const decoded = decodeToken(token);
  if (!decoded) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

// Get remaining time until token expires (in seconds)
export const getTokenExpiryTime = (token: string | null): number => {
  if (!token) return 0;
  
  const decoded = decodeToken(token);
  if (!decoded) return 0;

  const currentTime = Math.floor(Date.now() / 1000);
  return Math.max(0, decoded.exp - currentTime);
};

// Get stored token from localStorage
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Get stored user from localStorage
export const getUser = () => {
  const user = localStorage.getItem('user');
  
  // Mencegah error jika localStorage menyimpan string "undefined" atau "null"
  if (!user || user === 'undefined' || user === 'null') {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch (error) {
    console.error('Failed to parse user data from localStorage:', error);
    return null;
  }
};

// Check if user is logged in
export const isLoggedIn = (): boolean => {
  const token = getToken();
  if (!token) return false;
  return !isTokenExpired(token);
};

// Clear all auth data
export const clearAuthData = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('tokenExpiry');
};

// Setup token expiry check (auto logout when token expires)
export const setupTokenExpiryCheck = (onTokenExpired: () => void): (() => void) => {
  const checkTokenExpiry = () => {
    const token = getToken();
    if (token && isTokenExpired(token)) {
      clearAuthData();
      onTokenExpired();
    }
  };

  // Check every minute
  const interval = setInterval(checkTokenExpiry, 60000);

  return () => clearInterval(interval);
};
