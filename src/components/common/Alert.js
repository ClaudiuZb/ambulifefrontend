import React from 'react';
import { useSelector } from 'react-redux';

const Alert = () => {
  const alerts = useSelector(state => state.ui.alerts);
  
  if (alerts.length === 0) return null;
  
  return (
    <div className="alert-container" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}>
      {alerts.map(alert => (
        <div key={alert.id} className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          {alert.msg}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      ))}
    </div>
  );
};

export default Alert;