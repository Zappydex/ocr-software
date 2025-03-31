// src/services/project/api.js
import api from '../apiConfig';

// Project management endpoints
export const fetchProjects = async () => {
  const response = await api.get('/api/projects/');
  return response.data;
};

export const fetchProject = async (projectId) => {
  const response = await api.get(`/api/projects/${projectId}/`);
  return response.data;
};

export const createProject = async (projectData) => {
  const response = await api.post('/api/projects/', projectData);
  return response.data;
};

export const updateProject = async (projectId, projectData) => {
  const response = await api.put(`/api/projects/${projectId}/`, projectData);
  return response.data;
};

export const deleteProject = async (projectId) => {
  const response = await api.delete(`/api/projects/${projectId}/`);
  return response.data;
};

export const toggleProjectActive = async (projectId) => {
  const response = await api.post(`/api/projects/${projectId}/toggle-active/`);
  return response.data;
};

// Project files endpoints
export const fetchProjectFiles = async (projectId) => {
  const response = await api.get(`/api/projects/${projectId}/files/`);
  return response.data;
};

export const downloadProjectFile = async (projectId, fileId) => {
  const response = await api.get(`/api/projects/${projectId}/files/${fileId}/download/`);
  return response.data;
};

// Project search endpoint
export const searchWithinProject = async (projectId, params) => {
  const response = await api.get(`/api/projects/${projectId}/search/`, { params });
  return response.data;
};

// Project anomalies endpoints
export const fetchProjectAnomalies = async (projectId, params = {}) => {
  const response = await api.get(`/api/projects/${projectId}/anomalies/`, { params });
  return response.data;
};

// Anomaly management endpoints
export const fetchAllAnomalies = async () => {
  const response = await api.get('/api/anomalies/');
  return response.data;
};

export const fetchAnomaly = async (anomalyId) => {
  const response = await api.get(`/api/anomalies/${anomalyId}/`);
  return response.data;
};

export const resolveAnomaly = async (anomalyId, resolutionData = { resolved: true }) => {
  const response = await api.patch(`/api/anomalies/${anomalyId}/`, resolutionData);
  return response.data;
};

// OCR processing endpoints
export const processInvoices = async (projectId, files) => {
  const formData = new FormData();
  
  // Append each file to the form data
  files.forEach(file => {
    formData.append('files', file);
  });
  
  const response = await api.post(`/api/projects/${projectId}/process-invoices/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
};

export const checkOCRStatus = async (projectId, taskId) => {
  const response = await api.get(`/api/projects/${projectId}/ocr-status/${taskId}/`);
  return response.data;
};

export const checkOCRTask = async (projectId, taskId) => {
  const response = await api.get(`/api/projects/${projectId}/ocr-check-task/${taskId}/`);
  return response.data;
};

export const cancelOCRProcess = async (projectId, taskId) => {
  const response = await api.post(`/api/projects/${projectId}/ocr-cancel/${taskId}/`);
  return response.data;
};

export const downloadOCRResults = async (projectId, taskId) => {
  const response = await api.get(`/api/projects/${projectId}/ocr-download/${taskId}/`);
  return response.data;
};

export const validateOCRResults = async (projectId, taskId) => {
  const response = await api.get(`/api/projects/${projectId}/ocr-validation/${taskId}/`);
  return response.data;
};

export const getOCRAnomalies = async (projectId, taskId) => {
  const response = await api.get(`/api/projects/${projectId}/ocr-anomalies/${taskId}/`);
  return response.data;
};

export const getOCRResults = async (projectId, taskId) => {
  const response = await api.get(`/api/projects/${projectId}/ocr-results/${taskId}/`);
  return response.data;
};

export const checkOCRHealth = async () => {
  const response = await api.get('/api/ocr-health/');
  return response.data;
};
