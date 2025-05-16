import {
    USER_LOADING,
    USER_LOADED,
    AUTH_ERROR,
    LOGIN_SUCCESS,
    LOGIN_FAIL,
    LOGOUT,
    CLEAR_ERRORS,
    USER_UPDATE // Adăugăm noul tip
  } from '../actions/types';
  
  const initialState = {
    token: localStorage.getItem('token'),
    isAuthenticated: null,
    loading: false,
    user: null,
    error: null
  };
  
  export default function authReducer(state = initialState, action) {
    switch (action.type) {
      case USER_LOADING:
        return {
          ...state,
          loading: true
        };
      case USER_LOADED:
        return {
          ...state,
          isAuthenticated: true,
          loading: false,
          user: action.payload
        };
      case LOGIN_SUCCESS:
        localStorage.setItem('token', action.payload.token);
        return {
          ...state,
          ...action.payload,
          isAuthenticated: true,
          loading: false,
          error: null
        };
      case AUTH_ERROR:
      case LOGIN_FAIL:
      case LOGOUT:
        localStorage.removeItem('token');
        return {
          ...state,
          token: null,
          isAuthenticated: false,
          loading: false,
          user: null,
          error: action.payload
        };
      case CLEAR_ERRORS:
        return {
          ...state,
          error: null
        };
                case USER_UPDATE:
                    console.log('============ USER_UPDATE REDUCER ============');
                    console.log('Current state:', state);
                    console.log('Action payload:', action.payload);
                    
                    return {
                      ...state,
                      user: action.payload,
                      loading: false
                    };
                default:
                    return state;
            }
        }