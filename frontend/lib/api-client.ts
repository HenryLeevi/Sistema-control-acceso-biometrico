import { AuthResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
const MOCK_MODE = typeof process.env.NEXT_PUBLIC_MOCK_MODE === 'undefined'
  ? true
  : process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== 'undefined') {
    localStorage.setItem('refresh_token', refresh);
  }
};

export const getAccessToken = () => accessToken;

export const getRefreshToken = () => {
  if (!refreshToken && typeof window !== 'undefined') {
    refreshToken = localStorage.getItem('refresh_token');
  }
  return refreshToken;
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('refresh_token');
  }
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();
    accessToken = data.access;
    return data.access;
  } catch (error) {
    clearTokens();
    return null;
  }
};

interface ApiClientOptions extends RequestInit {
  skipAuth?: boolean;
  retries?: number;
}

export const apiClient = async <T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> => {
  const { skipAuth = false, retries = 1, ...fetchOptions } = options;

  const makeRequest = async (isRetry = false): Promise<Response> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    };

    if (!skipAuth && accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      if (response.status === 401 && !isRetry && !skipAuth) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return makeRequest(true);
        }
        window.location.href = '/login';
        throw new Error('Session expired');
      }

      return response;
    } catch (error) {
      if (MOCK_MODE) {
        throw new Error('API_UNAVAILABLE');
      }
      throw error;
    }
  };

  const response = await makeRequest();

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
};

export const apiClientFormData = async <T>(
  endpoint: string,
  formData: FormData,
  options: Omit<ApiClientOptions, 'body' | 'headers'> = {}
): Promise<T> => {
  const { skipAuth = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {};

  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...fetchOptions,
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryResponse = await fetch(url, {
        ...fetchOptions,
        method: 'POST',
        headers,
        body: formData,
      });
      if (!retryResponse.ok) {
        throw new Error(`HTTP ${retryResponse.status}`);
      }
      return retryResponse.json();
    }
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
};
