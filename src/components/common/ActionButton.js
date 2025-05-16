import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const ActionButton = ({ icon, title, to }) => {
  return (
    <Link to={to} className="action-button">
      <div className="action-icon">
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="action-title">{title}</div>
    </Link>
  );
};

export default ActionButton;