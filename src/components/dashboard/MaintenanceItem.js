import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, 
  faClock, 
  faCheckCircle,
  faSpinner,
  faTrash,
  faAmbulance,
  faCity,
  faTachometerAlt,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';

const MaintenanceItem = ({ maintenance }) => {
  // Helper pentru a obține iconul și culoarea în funcție de status
  const getStatusStyle = (status) => {
    switch (status) {
      case 'critical':
        return { icon: faExclamationTriangle, color: 'danger', text: 'Critic' };
      case 'pending':
        return { icon: faClock, color: 'warning', text: 'În așteptare' };
      case 'in-progress':
        return { icon: faSpinner, color: 'info', text: 'În lucru' };
      case 'scheduled':
      case 'planned':
        return { icon: faCalendarAlt, color: 'primary', text: 'Programat' };
      case 'completed':
        return { icon: faCheckCircle, color: 'success', text: 'Finalizat' };
      case 'cancelled':
        return { icon: faTrash, color: 'secondary', text: 'Anulat' };
      default:
        return { icon: faClock, color: 'warning', text: status };
    }
  };
  
  const statusStyle = getStatusStyle(maintenance.status);
  
  return (
    <div className="maintenance-item mb-4">
      <div className="row">
        <div className="col-md-3">
          <div className="maintenance-image">
            <img 
              src={maintenance.image} 
              alt={maintenance.title} 
              className="img-fluid rounded"
            />
            <div className={`status-badge badge bg-${statusStyle.color}`}>
              <FontAwesomeIcon icon={statusStyle.icon} className="me-1" />
              {statusStyle.text}
            </div>
          </div>
        </div>
        <div className="col-md-9">
          <div className="maintenance-content">
            <h5>{maintenance.title}</h5>
            <div className="maintenance-details mb-2">
              <span className="me-3">
                <FontAwesomeIcon icon={faAmbulance} className="text-muted me-1" />
                {maintenance.vehicle}
              </span>
              <span className="me-3">
                <FontAwesomeIcon icon={faCity} className="text-muted me-1" />
                {maintenance.location}
              </span>
              <span>
                <FontAwesomeIcon icon={faTachometerAlt} className="text-muted me-1" />
                {maintenance.km} km
              </span>
            </div>
            <p className="maintenance-description text-muted">
              {maintenance.description.length > 200 
                ? maintenance.description.substring(0, 200) + '...' 
                : maintenance.description}
            </p>
            <div className="maintenance-actions">
              <Link 
                to={`/mechanic/service/${maintenance.id}`}
                className="btn btn-sm btn-outline-primary"
              >
                Vezi detalii
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .maintenance-item {
          border-bottom: 1px solid #e9ecef;
          padding-bottom: 1.5rem;
        }
        
        .maintenance-item:last-child {
          border-bottom: none;
        }
        
        .maintenance-image {
          position: relative;
          height: 150px;
          overflow: hidden;
          border-radius: 0.5rem;
        }
        
        .maintenance-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .status-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          font-size: 0.75rem;
          padding: 0.35rem 0.65rem;
        }
        
        .maintenance-content {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .maintenance-description {
          flex-grow: 1;
          font-size: 0.9rem;
        }
        
        .maintenance-actions {
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default MaintenanceItem;