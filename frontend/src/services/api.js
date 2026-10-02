const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      errorMsg = data.error || data.message || errorMsg;
    } catch {
      if (response.status === 404) errorMsg = 'Endpoint not found (404)';
      if (response.status === 401) errorMsg = 'Authentication required or invalid credentials';
      if (response.status === 403) errorMsg = 'Access forbidden for your current role';
      if (response.status === 405) errorMsg = 'HTTP method not allowed for this endpoint';
      if (response.status === 500) errorMsg = 'Server internal error occurred';
    }
    throw new ApiError(response.status, errorMsg);
  }
  return response.json();
}

function getAuthHeaders() {
  const token = localStorage.getItem('securedocs_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  get: async (endpoint) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: { ...getAuthHeaders(), Accept: 'application/json' },
    });
    return handleResponse(res);
  },

  post: async (endpoint, body) => {
    const headers = getAuthHeaders();
    let payload = body;
    if (body instanceof FormData) {
      payload = body;
    } else {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: payload,
    });
    return handleResponse(res);
  },

  patch: async (endpoint, body) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  delete: async (endpoint) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

export function getApiUrl(endpoint) {
  return `${API_BASE}${endpoint}`;
}
