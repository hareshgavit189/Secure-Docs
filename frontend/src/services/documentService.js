import { api } from './api';

export const documentService = {
  getDocuments: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.caseId) query.append('caseId', params.caseId);
    if (params.type) query.append('type', params.type);
    if (params.status) query.append('status', params.status);
    if (params.integrity) query.append('integrity', params.integrity);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return api.get(`/documents${queryString}`);
  },

  getDocumentById: async (id) => {
    return api.get(`/documents/${id}`);
  },

  uploadDocument: async (formData) => {
    return api.post('/documents/upload', formData);
  },

  verifyDocument: async (verificationData) => {
    return api.post('/documents/verify', verificationData);
  },

  deleteDocument: async (id) => {
    return api.delete(`/documents/${id}`);
  },

  getDownloadUrl: (id) => {
    return `/api/documents/${id}/download`;
  },
};
