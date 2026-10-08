import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('crimemap_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle authentication expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        localStorage.removeItem('crimemap_token');
        localStorage.removeItem('crimemap_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const incidentsAPI = {
  getAll: (params) => api.get('/incidents', { params }),
  getById: (id) => api.get(`/incidents/${id}`),
  create: (data) => api.post('/incidents', data),
  update: (id, data) => api.put(`/incidents/${id}`, data),
  delete: (id) => api.delete(`/incidents/${id}`),
};

export const stationsAPI = {
  getAll: () => api.get('/stations'),
  getById: (id) => api.get(`/stations/${id}`),
  create: (data) => api.post('/stations', data),
  update: (id, data) => api.put(`/stations/${id}`, data),
};

export const crimeTypesAPI = {
  getAll: () => api.get('/crime-types'),
};

export const analyticsAPI = {
  getSummary: (params) => api.get('/analytics/summary', { params }),
  getByType: (params) => api.get('/analytics/by-type', { params }),
  getByDate: (params) => api.get('/analytics/by-date', { params }),
  getByHour: (params) => api.get('/analytics/by-hour', { params }),
  getByWeekday: (params) => api.get('/analytics/by-weekday', { params }),
  getByStation: (params) => api.get('/analytics/by-station', { params }),
};

export const mapAPI = {
  getIncidents: (params) => api.get('/map/incidents', { params }),
  getHeatmap: (params) => api.get('/map/heatmap', { params }),
  getGeoJSON: (params) => api.get('/map/geojson', { params }),
  getGeoJson: (params) => api.get('/map/geojson', { params }),
  spatialQuery: (params) => api.get('/map/spatial-query', { params }),
  getNearbyStation: (lat, lon) => api.get('/map/nearby-stations', { params: { lat, lon } }),
};

export const hotspotsAPI = {
  getAll: (params) => api.get('/hotspots', { params }),
  detect: (params) => api.post('/hotspots/detect', params),
};

export const predictionAPI = {
  getResults: (limit) => api.get('/prediction/results', { params: limit ? { limit } : undefined }),
  run: (params) => api.post('/prediction/run', params),
};

export const alertsAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  acknowledge: (id, data) => api.post(`/alerts/${id}/acknowledge`, data),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
};

export const auditAPI = {
  getAll: (params) => api.get('/audit-logs', { params }),
};

export const importAPI = {
  uploadCSV: (formData, commit = false) =>
    api.post(`/import/csv?commit=${commit}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const reportsAPI = {
  getSummary: (params) => api.get('/reports/summary', { params }),
  downloadPDF: (params) =>
    api.get('/reports/pdf', {
      params,
      responseType: 'blob',
    }),
};

// Aliases for convenient importing
export const authApi = authAPI;
export const incidentsApi = incidentsAPI;
export const stationsApi = stationsAPI;
export const crimeTypesApi = crimeTypesAPI;
export const analyticsApi = analyticsAPI;
export const mapApi = mapAPI;
export const hotspotApi = hotspotsAPI;
export const hotspotsApi = hotspotsAPI;
export const predictionApi = predictionAPI;
export const alertsApi = alertsAPI;
export const usersApi = usersAPI;
export const auditApi = auditAPI;
export const importApi = importAPI;
export const reportsApi = reportsAPI;

export default api;
