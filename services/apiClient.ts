// Base configuration for API
export const API_BASE_URL = 'http://localhost:8080';

export interface ApiError {
  message: string;
  status?: number;
}

// Helper to get headers with JWT
const getHeaders = (token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Generic request handler
async function request<T>(endpoint: string, config: RequestInit = {}): Promise<T> {
  // Get token from local storage or memory if needed. 
  // For this architecture, we pass the token usually, but here's a simple retrieval if stored
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...config,
    headers: {
      ...getHeaders(token || undefined),
      ...config.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw {
      message: errorBody.message || `API Error: ${response.statusText}`,
      status: response.status,
    } as ApiError;
  }

  // Parse JSON response
  const data = await response.json();
  return data.data ? data.data : data; // Handle { success: true, data: ... } wrapper
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
