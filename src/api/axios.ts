import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('schemesaathi_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (
      response &&
      typeof response.data === 'string' &&
      response.data.trim().startsWith('<')
    ) {
      return Promise.reject(new Error('NON_JSON_HTML_RESPONSE'));
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export default api;
