import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const StatsCard = ({ icon, value, label, footer, iconBgColor }) => {
  return (
    <div className="stats-card">
      <div className="stats-icon" style={{ backgroundColor: iconBgColor || 'var(--primary-color)' }}>
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="stats-value">{value}</div>
      <div className="stats-label">{label}</div>
      {footer && (
        <div className="stats-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default StatsCard;