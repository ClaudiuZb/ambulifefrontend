import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const ServiceItem = ({ icon, title, info, amount, iconBgColor }) => {
  return (
    <div className="service-item">
      <div className="service-icon" style={{ backgroundColor: iconBgColor || 'var(--primary-color)' }}>
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="service-details">
        <div className="service-title">{title}</div>
        <div className="service-info">{info}</div>
      </div>
      <div className={`service-amount ${amount.startsWith('+') ? 'text-success' : amount.startsWith('-') ? 'text-danger' : ''}`}>
        {amount}
      </div>
    </div>
  );
};

export default ServiceItem;