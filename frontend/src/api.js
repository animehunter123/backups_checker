import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getFiles = async () => {
  const response = await api.get('/files');
  return response.data;
};

export const getServers = async () => {
  const response = await api.get('/servers');
  return response.data;
};

export const scanDirectories = async () => {
  const response = await api.post('/scan/directories');
  return response.data;
};

export const scanServers = async () => {
  const response = await api.post('/scan/servers');
  return response.data;
};

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};
