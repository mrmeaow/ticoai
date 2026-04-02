import axios, { type AxiosRequestConfig, type AxiosInstance } from 'axios';

// Create a configurable axios instance
let axiosInstance: AxiosInstance = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Function to configure the base URL (call this from your app)
export function configureSdk(baseUrl: string): void {
  axiosInstance.defaults.baseURL = baseUrl;
}

// Function to set the auth token (call this from your auth interceptor)
export function setAuthToken(token: string | null): void {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
}

// Custom instance function used by Orval-generated code
export async function customInstance<T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> {
  const response = await axiosInstance({
    ...config,
    ...options,
  });

  return response.data;
}

// Export the axios instance for advanced usage
export { axiosInstance };

// Re-export axios types for convenience
export type { AxiosRequestConfig, AxiosInstance };
