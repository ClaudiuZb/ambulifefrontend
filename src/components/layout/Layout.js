import React from 'react';
import { useSelector } from 'react-redux';
import AdminSidebar from './AdminSidebar';
import AssistantSidebar from './AssistantSidebar';
import MechanicSidebar from './MechanicSidebar';
import Spinner from './Spinner';

const Layout = ({ children }) => {
  const { user, loading } = useSelector(state => state.auth);

  // Render loading spinner when loading
  if (loading || !user) {
    return <Spinner />;
  }

  // Select sidebar based on user role
  const renderSidebar = () => {
    switch (user.role) {
      case 'admin':
        return <AdminSidebar />;
      case 'assistant':
        return <AssistantSidebar />;
      case 'mechanic':
        return <MechanicSidebar />;
      default:
        return null;
    }
  };

  return (
    <div>
      {renderSidebar()}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;