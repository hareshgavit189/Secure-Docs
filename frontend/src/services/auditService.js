import { api } from './api';

export const auditService = {
  getAuditLogs: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.limit) query.append('limit', params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return api.get(`/audit${queryString}`);
  },

  verifyChain: async () => {
    return api.get('/audit/verify-chain');
  },

  getDashboardStats: async () => {
    return api.get('/dashboard/stats');
  },
};
