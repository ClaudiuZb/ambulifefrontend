import axios from 'axios';
import setAuthToken from '../../utils/setAuthToken';
import {
  USER_LOADING,
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
  CLEAR_ERRORS,
  USER_UPDATE
} from './types';

// Load User
export const loadUser = () => async dispatch => {
  if (localStorage.token) {
    setAuthToken(localStorage.token);
  }

  try {
    dispatch({ type: USER_LOADING });
    
    const res = await axios.get('/api/auth/me');

    dispatch({
      type: USER_LOADED,
      payload: res.data.data
    });
  } catch (err) {
    dispatch({ type: AUTH_ERROR });
  }
};

// Login User
export const login = (email, password) => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const body = JSON.stringify({ email, password });

  try {
    dispatch({ type: USER_LOADING });
    
    const res = await axios.post('/api/auth/login', body, config);

    dispatch({
      type: LOGIN_SUCCESS,
      payload: res.data
    });

    dispatch(loadUser());
  } catch (err) {
    dispatch({
      type: LOGIN_FAIL,
      payload: err.response?.data?.message || 'A apărut o eroare la autentificare'
    });
  }
};

// Logout
export const logout = () => dispatch => {
  dispatch({ type: LOGOUT });
};

// Clear Errors
export const clearErrors = () => dispatch => {
  dispatch({ type: CLEAR_ERRORS });
};

// Update User (pentru asignarea vehiculelor)
export const updateUser = (userData) => {
  return {
    type: USER_UPDATE,
    payload: userData
  };
};