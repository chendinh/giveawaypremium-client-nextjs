import axios, { AxiosInstance } from 'axios';

// const API_MAP: Record<string, string> = {
//   development: process.env.NEXT_PUBLIC_API_URL_DEVELOPMENT || '',
//   production: process.env.NEXT_PUBLIC_API_URL_PRODUCTION || '',
//   staging: process.env.NEXT_PUBLIC_API_URL_STAGING || '',
//   default: process.env.NEXT_PUBLIC_API_URL || '',
// };

export const API_TYPES = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  STAGING: 'staging',
  DEFAULT: 'default',
};

export type ApiType = 'development' | 'production' | 'staging' | 'default';

interface CreateAxiosOptions {
  baseURL?: string;
  authType?: AuthType;
  token?: string;
  apiNameOrUrl?: string;
}

export type AuthType = 'none' | 'bearer' | 'apikey' | 'cookie';

export const AUTH_TYPES = {
  NONE: 'none' as AuthType,
  BEARER: 'bearer' as AuthType,
  APIKEY: 'apikey' as AuthType,
  COOKIE: 'cookie' as AuthType,
};

/**
 * Hàm tạo Axios instance có thể tùy biến baseURL và loại auth
 */
export function createAxiosInstance(
  options: CreateAxiosOptions = {
    authType: AUTH_TYPES.BEARER,
    apiNameOrUrl: API_TYPES.DEFAULT,
    token: undefined,
  }
): AxiosInstance {
  const baseURL = process.env.NEXT_PUBLIC_API_URL;

  console.log('Creating Axios instance with baseURL:', baseURL);

  const instance = axios.create({
    baseURL: baseURL,
    withCredentials: options.authType === AUTH_TYPES.COOKIE,
    timeout: 15000,
  });

  // 🟢 Request Interceptor
  instance.interceptors.request.use(
    config => {
      if (options.authType === AUTH_TYPES.BEARER) {
        const token =
          options.token || typeof window !== 'undefined'
            ? localStorage.getItem('access_token')
            : null;
        if (token) config.headers.Authorization = `Bearer ${token}`;
      }

      if (options.authType === AUTH_TYPES.COOKIE) {
        const token =
          options.token || typeof window !== 'undefined'
            ? localStorage.getItem('access_token')
            : null;
        if (token) config.headers.Authorization = `${token}`;
      }

      if (options.authType === AUTH_TYPES.APIKEY && options.token) {
        config.headers['x-api-key'] = options.token;
      }

      if (options.authType === 'none') {
        config.headers.Authorization = '';
      }

      return config;
    },
    error => Promise.reject(error)
  );

  // 🟥 Response Interceptor
  instance.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        console.warn('Unauthorized — maybe token expired?');
        // Tùy logic: logout, refresh token, hoặc redirect login
      }
      return Promise.reject(error);
    }
  );

  return instance;
}
