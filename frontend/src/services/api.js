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

  uploadWithProgress: (endpoint, formData, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let lastLoaded = 0;
      let lastTime = Date.now();

      xhr.open('POST', `${API_BASE}${endpoint}`, true);

      // Add auth headers
      const token = localStorage.getItem('securedocs_token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.setRequestHeader('Accept', 'application/json');

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const currentTime = Date.now();
            const timeDiff = (currentTime - lastTime) / 1000; // in seconds
            let speed = 0;
            if (timeDiff > 0.2) {
              speed = (e.loaded - lastLoaded) / timeDiff; // bytes per second
              lastLoaded = e.loaded;
              lastTime = currentTime;
            }

            const percent = Math.min(100, Math.round((e.loaded / e.total) * 100));
            onProgress({
              loaded: e.loaded,
              total: e.total,
              percent,
              speed, // bytes/sec
            });
          }
        };
      }

      xhr.onload = () => {
        try {
          const contentType = xhr.getResponseHeader('Content-Type') || '';
          const response = contentType.includes('application/json')
            ? JSON.parse(xhr.responseText)
            : { message: xhr.responseText };

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(response);
          } else {
            const errMsg = response.error || response.message || `Upload failed (${xhr.status})`;
            reject(new ApiError(xhr.status, errMsg));
          }
        } catch (err) {
          reject(new ApiError(xhr.status, err.message || 'Error parsing server response'));
        }
      };

      xhr.onerror = () => {
        reject(new ApiError(0, 'Network connection interrupted during upload. Check server connection.'));
      };

      xhr.ontimeout = () => {
        reject(new ApiError(408, 'Upload request timed out.'));
      };

      // Set timeout to 0 (no client-side xhr timeout)
      xhr.timeout = 0;

      xhr.send(formData);
    });
  },
};

export function getApiUrl(endpoint) {
  return `${API_BASE}${endpoint}`;
}
