import axios from 'axios';

// Determină URL-ul de bază în funcție de mediu
const getBaseUrl = () => {
  // Pentru producție
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Pentru ngrok (dacă este configurat)
  if (process.env.REACT_APP_NGROK_URL) {
    return process.env.REACT_APP_NGROK_URL;
  }
  
  // Fallback pentru dezvoltare locală (folosește proxy)
  return '';
};

// Configurează axios global
const baseURL = getBaseUrl();
if (baseURL) {
  axios.defaults.baseURL = baseURL;
}

// Interceptor pentru a adăuga token-ul de autentificare la fiecare cerere (dacă există)
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export default axios;