// src/services/search/api.js
import api from '../apiConfig';

// Global search endpoint
export const globalSearch = async (params) => {
  const response = await api.get('/api/search/', { params });
  return response.data;
};

// Get available filter options
export const getFilterOptions = async () => {
  const response = await api.get('/api/filter-options/');
  return response.data;
};

// Retrieve files based on criteria
export const retrieveFiles = async (params) => {
  const response = await api.get('/api/retrieve-files/', { params });
  return response.data;
};

// Download a specific file
export const downloadFile = async (fileId) => {
  const response = await api.get(`/api/files/${fileId}/download/`);
  return response.data;
};

// Search history management
export const getSearchHistory = async () => {
  const response = await api.get('/api/search/history/');
  return response.data;
};

export const getSearchHistoryDetail = async (historyId) => {
  const response = await api.get(`/api/search/history/${historyId}/`);
  return response.data;
};

export const clearSearchHistory = async () => {
  const response = await api.delete('/api/search/history/clear/');
  return response.data;
};
