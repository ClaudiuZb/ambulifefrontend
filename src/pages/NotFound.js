import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faHome } from '@fortawesome/free-solid-svg-icons';

const NotFound = () => {
  return (
    <div style={{ 
      backgroundColor: 'var(--bg-dark)', 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      color: 'var(--text-light)'
    }}>
      <div className="text-center">
        <FontAwesomeIcon icon={faExclamationTriangle} size="6x" style={{ color: 'var(--warning-color)' }} />
        <h1 className="mt-4 mb-3" style={{ fontSize: '4rem' }}>404</h1>
        <h2 className="mb-4">Pagină negăsită</h2>
        <p className="mb-4">Ne pare rău, pagina pe care o căutați nu există sau a fost mutată.</p>
        <Link to="/dashboard" className="btn btn-primary">
          <FontAwesomeIcon icon={faHome} className="me-2" /> Înapoi la Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;