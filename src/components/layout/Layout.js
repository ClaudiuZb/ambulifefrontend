import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import AdminSidebar from './AdminSidebar';
import AssistantSidebar from './AssistantSidebar';
import MechanicSidebar from './MechanicSidebar';
import Spinner from './Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

const Layout = ({ children }) => {
  const { user, loading } = useSelector(state => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Închide sidebar-ul când se face click în afara lui pe dispozitive mobile
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (window.innerWidth < 768 && 
          sidebarOpen && 
          e.target.closest('.sidebar') === null && 
          e.target.closest('.hamburger-btn') === null) {
        setSidebarOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [sidebarOpen]);

  // Închide sidebar-ul când se redimensionează fereastra la desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false); // Nu mai trebuie starea pe desktop
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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

  // Stiluri CSS pentru layout responsive
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
    },
    sidebarContainer: {
      position: 'fixed',
      top: 0,
      bottom: 0,
      left: sidebarOpen ? '0' : '-250px',
      width: '250px',
      zIndex: 1030,
      transition: 'left 0.3s ease-in-out',
      backgroundColor: '#121212',
      overflowY: 'auto',
      boxShadow: sidebarOpen ? '2px 0 5px rgba(0,0,0,0.3)' : 'none',
    },
    desktopSidebar: {
      width: '200px',
      flexShrink: 0,
      display: 'none',
    },
    mainContent: {
      flexGrow: 1,
      transition: 'margin-left 0.3s ease-in-out',
      marginLeft: 0, // Pe mobile nu are margin
    },
    hamburgerBtn: {
      position: 'fixed',
      top: '10px',
      left: sidebarOpen ? '210px' : '10px',
      zIndex: 1031,
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#212529',
      border: '1px solid #444',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'left 0.3s ease-in-out',
    },
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 1029,
    },
  };

  // Adăugăm CSS media queries ca style tags
  useEffect(() => {
    // Verificăm dacă există deja stilul
    if (!document.getElementById('layout-responsive-styles')) {
      const styleTag = document.createElement('style');
      styleTag.id = 'layout-responsive-styles';
      styleTag.innerHTML = `
        @media (min-width: 768px) {
          .main-content {
            margin-left: 200px !important;
          }
          .desktop-sidebar {
            display: block !important;
          }
          .hamburger-btn {
            display: none !important;
          }
        }
        
        @media (max-width: 767px) {
          .main-content {
            padding-top: 60px; /* Spațiu pentru butonul hamburger */
          }
        }
      `;
      document.head.appendChild(styleTag);
    }
    
    return () => {
      // Curățăm stilul când componenta este demontată
      const styleTag = document.getElementById('layout-responsive-styles');
      if (styleTag) {
        document.head.removeChild(styleTag);
      }
    };
  }, []);

  return (
    <div style={styles.container}>
      {/* Buton hamburger - vizibil doar pe mobile */}
      <button 
        className="hamburger-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={styles.hamburgerBtn}
      >
        <FontAwesomeIcon icon={sidebarOpen ? faTimes : faBars} />
      </button>

      {/* Overlay pentru a închide sidebar-ul când se face click în afara - vizibil doar pe mobile când sidebar-ul este deschis */}
      {sidebarOpen && (
        <div 
          className="overlay"
          style={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Container pentru sidebar și conținut principal */}
      <div style={{ display: 'flex', flexGrow: 1 }}>
        {/* Sidebar container - se afișează pe mobile când este deschis */}
        <div 
          className="sidebar"
          style={styles.sidebarContainer}
        >
          {renderSidebar()}
        </div>

        {/* Pe desktop, afișăm sidebar-ul normal */}
        <div className="desktop-sidebar" style={styles.desktopSidebar}>
          {renderSidebar()}
        </div>

        {/* Conținut principal - are marjă stânga pe desktop, dar nu pe mobile */}
        <main className="main-content" style={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
