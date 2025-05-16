import axios from 'axios';
import {
  GET_USERS,
  GET_USER,
  ADD_USER,
  UPDATE_USER,
  DELETE_USER,
  USERS_ERROR,
  SET_LOADING_USERS,
  CLEAR_USER
} from './types';
import { setAlert } from './uiActions';

// Get all users
export const getUsers = () => async dispatch => {
  try {
    dispatch({ type: SET_LOADING_USERS });

    const res = await axios.get('/api/auth/users');

    dispatch({
      type: GET_USERS,
      payload: res.data.data
    });
  } catch (err) {
    dispatch({
      type: USERS_ERROR,
      payload: err.response?.data?.message || 'Eroare la obținerea utilizatorilor'
    });
  }
};

// Get user by ID
export const getUser = id => async dispatch => {
  try {
    dispatch({ type: SET_LOADING_USERS });

    const res = await axios.get(`/api/auth/users/${id}`);

    dispatch({
      type: GET_USER,
      payload: res.data.data
    });
  } catch (err) {
    dispatch({
      type: USERS_ERROR,
      payload: err.response?.data?.message || 'Eroare la obținerea utilizatorului'
    });
  }
};

// Add new user
export const addUser = (formData) => async dispatch => {
  try {
    dispatch({ type: SET_LOADING_USERS });

    const res = await axios.post('/api/auth/users', formData);

    dispatch({
      type: ADD_USER,
      payload: res.data.data
    });

    dispatch(setAlert('Utilizator adăugat cu succes', 'success'));
    
    return res.data.data; // Pentru a putea redirecționa după adăugare
  } catch (err) {
    dispatch({
      type: USERS_ERROR,
      payload: err.response?.data?.message || 'Eroare la adăugarea utilizatorului'
    });
    
    dispatch(setAlert(err.response?.data?.message || 'Eroare la adăugarea utilizatorului', 'danger'));
    
    throw err; // Aruncă eroarea pentru a o gestiona în componenta
  }
};

// Update user
export const updateUser = (id, formData) => async dispatch => {
  try {
    dispatch({ type: SET_LOADING_USERS });

    const res = await axios.put(`/api/auth/users/${id}`, formData);

    dispatch({
      type: UPDATE_USER,
      payload: res.data.data
    });

    dispatch(setAlert('Utilizator actualizat cu succes', 'success'));
    
    return res.data.data;
  } catch (err) {
    dispatch({
      type: USERS_ERROR,
      payload: err.response?.data?.message || 'Eroare la actualizarea utilizatorului'
    });
    
    dispatch(setAlert(err.response?.data?.message || 'Eroare la actualizarea utilizatorului', 'danger'));
    
    throw err;
  }
};

// Delete user
export const deleteUser = id => async dispatch => {
  try {
    dispatch({ type: SET_LOADING_USERS });

    await axios.delete(`/api/auth/users/${id}`);

    dispatch({
      type: DELETE_USER,
      payload: id
    });

    dispatch(setAlert('Utilizator șters cu succes', 'success'));
  } catch (err) {
    dispatch({
      type: USERS_ERROR,
      payload: err.response?.data?.message || 'Eroare la ștergerea utilizatorului'
    });
    
    dispatch(setAlert(err.response?.data?.message || 'Eroare la ștergerea utilizatorului', 'danger'));
  }
};

// Clear current user
export const clearUser = () => ({ type: CLEAR_USER });