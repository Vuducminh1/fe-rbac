
export const EMR_BASE_URL = 'http://localhost:8080';

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
async function request<T>(endpoint: string, baseUrl: string, config: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const fullUrl = `${baseUrl}${endpoint}`;
  
  console.log(`[API_CLIENT] 🚀 Requesting: ${config.method || 'GET'} ${endpoint}`);

  try {
    const response = await fetch(fullUrl, {
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

  } catch (error: any) {
    console.error(`[API_CLIENT] ❌ Request failed for ${endpoint}:`, error);
    

    throw error;
  }
}

// Client duy nhất cho toàn bộ ứng dụng (Port 8080)
export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, EMR_BASE_URL, { method: 'GET' }),
  post: <T>(endpoint: string, body: any) => request<T>(endpoint, EMR_BASE_URL, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: any) => request<T>(endpoint, EMR_BASE_URL, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, EMR_BASE_URL, { method: 'DELETE' }),
};
