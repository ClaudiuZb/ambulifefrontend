// src/api.js
import axios from 'axios';

const baseURL =
  process.env.REACT_APP_API_URL && process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_API_URL
    : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
