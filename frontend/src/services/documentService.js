import { api, getApiUrl } from './api';

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

  uploadDocument: async (formData, onProgress) => {
    if (onProgress || formData instanceof FormData) {
      return api.uploadWithProgress('/documents/upload', formData, onProgress);
    }
    return api.post('/documents/upload', formData);
  },

  verifyDocument: async (verificationData, onProgress) => {
    if (verificationData instanceof FormData) {
      return api.uploadWithProgress('/documents/verify', verificationData, onProgress);
    }
    return api.post('/documents/verify', verificationData);
  },

  deleteDocument: async (id) => {
    return api.delete(`/documents/${id}`);
  },

  getDownloadUrl: (id) => {
    return getApiUrl(`/documents/${id}/download`);
  },
};
