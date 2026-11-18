import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { backendDomain } from '@/constants/Domain';
import { useAuthStore } from '@/store/useAuthStore';

// Central token storage utility
export const tokenStorage = {
  setAccessToken: (token: string) => localStorage.setItem('accessToken', token),
  getAccessToken: () => localStorage.getItem('accessToken'),
  setRefreshToken: (token: string) => localStorage.setItem('refreshToken', token),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setOrgData: (orgId: string, orgName: string) => {
    localStorage.setItem('orgId', orgId);
    localStorage.setItem('orgName', orgName);
  },
  getOrgData: () => ({
    orgId: localStorage.getItem('orgId'),
    orgName: localStorage.getItem('orgName')
  }),
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('orgId');
    localStorage.removeItem('orgName');
  },
  isTokenExpired: (token: string): boolean => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
};

// Queue for handling concurrent 401s during token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Navigation callback for redirecting on unrecoverable session expiry
let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorizedCallback = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

// Check if request is a public auth route that shouldn't attempt token refresh
const isPublicAuthRoute = (url?: string): boolean => {
  if (!url) return false;
  return (
    url.includes('/general/login') ||
    url.includes('/general/check-email') ||
    url.includes('/general/verify-password') ||
    url.includes('/general/verify-otp') ||
    url.includes('/general/refresh-token') ||
    url.includes('/public/')
  );
};

// Attach standard request interceptor
const attachRequestInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const accessToken = tokenStorage.getAccessToken();
      if (accessToken && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      const { orgId } = tokenStorage.getOrgData();
      if (orgId && !isPublicAuthRoute(config.url) && !config.headers['X-Org-Id']) {
        config.headers['X-Org-Id'] = orgId;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );
};

// Centralized token refresh function with deduplication queue
export const refreshSessionTokens = async (): Promise<string> => {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    tokenStorage.clearTokens();
    useAuthStore.getState().clearAuth();
    if (onUnauthorizedCallback) {
      onUnauthorizedCallback();
    } else if (typeof window !== 'undefined' && window.location.pathname !== '/auth/signin') {
      window.location.href = '/auth/signin';
    }
    throw new Error('No refresh token available');
  }

  if (isRefreshing) {
    // If refresh is already in progress, queue and wait for the in-flight refresh to finish
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const refreshResponse = await axios.post(
      `${backendDomain}/api/v1/general/refresh-token`,
      { refreshToken },
      {
        withCredentials: true,
        headers: { Authorization: `Bearer ${refreshToken}` },
      }
    );

    const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;

    if (accessToken) {
      tokenStorage.setAccessToken(accessToken);
      if (newRefreshToken) {
        tokenStorage.setRefreshToken(newRefreshToken);
      }

      processQueue(null, accessToken);
      return accessToken;
    } else {
      throw new Error('No access token returned in refresh response');
    }
  } catch (refreshErr) {
    processQueue(refreshErr, null);
    tokenStorage.clearTokens();
    useAuthStore.getState().clearAuth();

    if (onUnauthorizedCallback) {
      onUnauthorizedCallback();
    } else if (typeof window !== 'undefined' && window.location.pathname !== '/auth/signin') {
      window.location.href = '/auth/signin';
    }
    throw refreshErr;
  } finally {
    isRefreshing = false;
  }
};

// Attach unified 401 response interceptor with refresh queue
const attachResponseInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (!originalRequest) {
        return Promise.reject(error);
      }

      // If error is 401 and not already retried and not a public auth route
      if (error.response?.status === 401 && !originalRequest._retry && !isPublicAuthRoute(originalRequest.url)) {
        originalRequest._retry = true;

        try {
          const newToken = await refreshSessionTokens();
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return instance(originalRequest);
        } catch (refreshErr) {
          return Promise.reject(refreshErr);
        }
      }

      return Promise.reject(error);
    }
  );
};

// 1. Create the unified apiClient instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: backendDomain,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

attachRequestInterceptor(apiClient);
attachResponseInterceptor(apiClient);

// 2. Also attach interceptors to global axios instance for legacy callers
axios.defaults.withCredentials = true;
attachRequestInterceptor(axios);
attachResponseInterceptor(axios);

// 3. Export typed helper methods
export const api = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then((res) => res.data),

  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config).then((res) => res.data),

  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config).then((res) => res.data),

  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, data, config).then((res) => res.data),

  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((res) => res.data),

  client: apiClient,
};

export default apiClient;
