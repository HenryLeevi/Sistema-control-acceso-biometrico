import { AuthResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
const MOCK_MODE = typeof process.env.NEXT_PUBLIC_MOCK_MODE === 'undefined'
  ? true
  : process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

/** Ensures every path sent to Django has a trailing slash. */
const normalizeUrl = (endpoint: string): string => {
  if (endpoint.startsWith('http')) return endpoint;
  const [path, query] = endpoint.split('?');
  const normalizedPath = path.endsWith('/') ? path : `${path}/`;
  return `${API_BASE_URL}${normalizedPath}${query ? `?${query}` : ''}`;
};

let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }
};

export const getAccessToken = () => {
  if (!accessToken && typeof window !== 'undefined') {
    accessToken = localStorage.getItem('access_token');
  }
  return accessToken;
};

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
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const response = await fetch(normalizeUrl('/auth/refresh/'), {
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', data.access);
    }
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

    const token = getAccessToken();
    if (!skipAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = normalizeUrl(endpoint);

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
    throw new Error(errorData.message || errorData.detail || `HTTP ${response.status}`);
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

  const token = getAccessToken();
  if (!skipAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = normalizeUrl(endpoint);

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
    throw new Error(errorData.message || errorData.detail || `HTTP ${response.status}`);
  }

  return response.json();
};
