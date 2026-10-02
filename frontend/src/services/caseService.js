import { api } from './api';

export const caseService = {
  getCases: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.priority) query.append('priority', params.priority);
    if (params.department) query.append('department', params.department);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return api.get(`/cases${queryString}`);
  },

  getCaseById: async (id) => {
    return api.get(`/cases/${id}`);
  },

  createCase: async (caseData) => {
    return api.post('/cases', caseData);
  },

  updateCase: async (id, updateData) => {
    return api.patch(`/cases/${id}`, updateData);
  },

  deleteCase: async (id) => {
    return api.delete(`/cases/${id}`);
  },
};
