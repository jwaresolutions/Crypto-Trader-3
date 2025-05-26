import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// API Configuration
export const API_CONFIG = {
  ALPACA_BASE_URL: process.env.REACT_APP_ALPACA_BASE_URL || 'https://paper-api.alpaca.markets',
  POLYGON_BASE_URL: process.env.REACT_APP_POLYGON_BASE_URL || 'https://api.polygon.io',
  ALPACA_API_KEY: process.env.REACT_APP_ALPACA_API_KEY || '',
  ALPACA_SECRET_KEY: process.env.REACT_APP_ALPACA_SECRET_KEY || '',
  POLYGON_API_KEY: process.env.REACT_APP_POLYGON_API_KEY || '',
};

// Alpaca API Client
class AlpacaAPIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.ALPACA_BASE_URL,
      headers: {
        'APCA-API-KEY-ID': API_CONFIG.ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': API_CONFIG.ALPACA_SECRET_KEY,
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`Alpaca API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Alpaca API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`Alpaca API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('Alpaca API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }
}

// Polygon API Client
class PolygonAPIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.POLYGON_BASE_URL,
      params: {
        apikey: API_CONFIG.POLYGON_API_KEY,
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`Polygon API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Polygon API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`Polygon API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('Polygon API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }
}

// Export singleton instances
export const alpacaAPI = new AlpacaAPIClient();
export const polygonAPI = new PolygonAPIClient();

// Error handling utilities
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const handleAPIError = (error: any): APIError => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return new APIError(
      data.message || `HTTP ${status} error`,
      status,
      data.code,
      data
    );
  } else if (error.request) {
    // Request was made but no response received
    return new APIError('Network error - no response received');
  } else {
    // Something else happened
    return new APIError(error.message || 'Unknown error occurred');
  }
};

// Rate limiting and retry logic
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      const delay = delayMs * Math.pow(2, attempt - 1);
      console.warn(`API call failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};
