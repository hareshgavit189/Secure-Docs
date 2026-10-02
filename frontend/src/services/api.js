const API_BASE = '/api';

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
      if (response.status === 500) errorMsg = 'Server internal error occurred';
    }
    throw new ApiError(response.status, errorMsg);
  }
  return response.json();
}

export const api = {
  get: async (endpoint) => {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('securedocs_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, { method: 'GET', headers });
    return handleResponse(res);
  },

  post: async (endpoint, body) => {
    const headers = {};
    const token = localStorage.getItem('securedocs_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let payload = body;
    if (body instanceof FormData) {
      // browser sets multipart content-type with boundary automatically
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
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('securedocs_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  delete: async (endpoint) => {
    const headers = {};
    const token = localStorage.getItem('securedocs_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, { method: 'DELETE', headers });
    return handleResponse(res);
  },
};
