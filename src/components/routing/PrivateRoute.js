import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Spinner from '../layout/Spinner';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector(state => state.auth);
  
  if (loading) return <Spinner />;
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return children;
};

export default PrivateRoute;