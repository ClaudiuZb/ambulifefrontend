// src/index.js
// src/index.js
import axios from 'axios';
import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';

// ─────────────── GLOBAL AXIOS SETUP ───────────────
// In development, falls back to '/api' so CRA proxy can forward to localhost:5000
// In production, uses the Render/Vercel URL baked into the build via REACT_APP_API_URL
axios.defaults.baseURL = process.env.REACT_APP_API_URL || '/api';

// Optional: auto-attach JWT token from localStorage to every request
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});
// ────────────────────────────────────────────────────

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
