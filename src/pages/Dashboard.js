import React from 'react';
import { useSelector } from 'react-redux';
import Layout from '../components/layout/Layout';
import AdminDashboard from './dashboards/AdminDashboard';
import AssistantDashboard from './dashboards/AssistantDashboard';
import MechanicDashboard from './dashboards/MechanicDashboard';
import Spinner from '../components/layout/Spinner';

const Dashboard = () => {
  const { user, loading } = useSelector(state => state.auth);
  
  if (loading || !user) {
    return <Spinner />;
  }
  
  // Render dashboard based on user role
  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'assistant':
        return <AssistantDashboard />;
      case 'mechanic':
        return <MechanicDashboard />;
      default:
        return <div>Dashboard nedisponibil pentru rolul dvs.</div>;
    }
  };
  
  return (
    <Layout>
      {renderDashboard()}
    </Layout>
  );
};

export default Dashboard;