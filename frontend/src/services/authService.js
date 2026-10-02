import { api } from './api';

export const authService = {
  login: async (identifier, password) => {
    return api.post('/auth/login', { identifier, password });
  },

  register: async (userData) => {
    return api.post('/auth/register', userData);
  },

  getCurrentUser: async () => {
    return api.get('/auth/me');
  },

  logout: async () => {
    try {
      await api.post('/auth/logout', {});
    } catch {}
    localStorage.removeItem('securedocs_token');
    localStorage.removeItem('securedocs_user');
  },
};
