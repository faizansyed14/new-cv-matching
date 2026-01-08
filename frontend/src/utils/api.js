import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/+$/, '') + '/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Upload APIs
export const uploadCVs = async (files) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const response = await api.post('upload/cv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const uploadJD = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('upload/jd', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Document APIs
export const getDocuments = async (fileType = null, category = null) => {
  const params = {};
  if (fileType) params.file_type = fileType;
  if (category) params.category = category;

  const response = await api.get('documents', { params });
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('documents/categories');
  return response.data;
};

export const getDocument = async (id) => {
  const response = await api.get(`documents/${id}`);
  return response.data;
};

export const viewDocument = (id) => {
  return `${API_BASE_URL}documents/${id}/view`;
};

export const deleteDocument = async (id) => {
  const response = await api.delete(`documents/${id}`);
  return response.data;
};

// Matching APIs
export const matchCVsToJD = async (jdId, cvIds = null, model = 'openai') => {
  const response = await api.post('match', {
    jd_id: jdId,
    cv_ids: cvIds,
    model: model,
  });
  return response.data;
};

export const getMatchHistory = async (limit = 10) => {
  const response = await api.get('match/history', {
    params: { limit },
  });
  return response.data;
};

export const getMatchDetails = async (matchId) => {
  const response = await api.get(`match/${matchId}`);
  return response.data;
};

export default api;
