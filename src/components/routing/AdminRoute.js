import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Spinner from '../layout/Spinner';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useSelector(state => state.auth);
  
  if (loading) return <Spinner />;
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  if (user && user.role !== 'admin') return <Navigate to="/dashboard" />;
  
  return children;
};

export default AdminRoute;