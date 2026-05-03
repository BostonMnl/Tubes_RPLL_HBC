// Interceptor untuk auto-inject JWT token ke setiap API request
// dan handle token refresh jika diperlukan

import { getToken, isTokenExpired } from '../utils/tokenManager';
import { authServices } from '../services/apiServices';

const API_BASE_URL = 'http://localhost:3000/api';

interface FetchOptions extends RequestInit {
  headers?: HeadersInit;
}

/**
 * Custom fetch wrapper dengan JWT token handling
 */
export async function fetchWithToken(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const headers = new Headers(options.headers || {});

  // Ensure content-type is always set to JSON
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Jika tidak ada token, langsung fetch
  let token = getToken();
  if (!token) {
    return fetch(url, { ...options, headers });
  }

  // Jika token expired, coba refresh
  if (isTokenExpired(token)) {
    try {
      await authServices.refreshToken();
      token = getToken();
    } catch (error) {
      console.warn('Token refresh failed, proceeding with expired token');
      // Lanjutkan dengan token yang expired, biar server yang reject
    }
  }

  // Add authorization header
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers });

  // Jika 401 Unauthorized, coba refresh token dan retry
  if (response.status === 401) {
    try {
      await authServices.refreshToken();
      const newToken = getToken();

      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`);
        response = await fetch(url, { ...options, headers });
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // Return 401 response
      return response;
    }
  }

  return response;
}

/**
 * Ganti semua fetch call dengan fetchWithToken untuk auto JWT handling
 * Atau gunakan di service layer
 */
