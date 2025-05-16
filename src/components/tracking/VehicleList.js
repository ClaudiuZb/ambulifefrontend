import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTruck, faLocationArrow, faUser, faClock } from '@fortawesome/free-solid-svg-icons';

const VehicleList = ({ positions = [], loading = false, onVehicleClick, activeUsers = [] }) => {
  // Funcție pentru a calcula timpul de când a început tura
  const getWorkDuration = (startTime) => {
    if (!startTime) return 'Necunoscut';
    
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m`;
  };

  if (loading) {
    return (
      <div className="content-card">
        <h5 className="mb-3">Vehicule</h5>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2">Se încarcă vehiculele...</p>
        </div>
      </div>
    );
  }
   
  return (
    <div className="content-card">
      <h5 className="mb-3">Vehicule</h5>
      
      {positions.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted">Nu există vehicule disponibile.</p>
        </div>
      ) : (
        <div className="vehicle-list">
          {positions.map(vehicle => {
            // Verificăm dacă vehiculul este asignat unui asistent
            const assignedUser = activeUsers.find(user => 
              user.activeVehicle && 
              (user.activeVehicle._id === vehicle.VehicleId || 
               user.activeVehicle.trackGpsVehicleId === vehicle.VehicleId)
            );
            
            return (
              <div 
                key={vehicle.VehicleId || Math.random().toString()}
                className={`vehicle-item ${assignedUser ? 'vehicle-item-assigned' : ''}`}
                onClick={() => onVehicleClick && onVehicleClick(vehicle)}
              >
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="mb-1">
                      <FontAwesomeIcon 
                        icon={faTruck}
                        className="me-2"
                        style={{ color: assignedUser ? '#28a745' : undefined }}
                      />
                      {vehicle.VehicleRegistrationNumber || "Necunoscut"}
                    </h6>
                    <div className="text-muted small">{vehicle.VehicleName || 'Ambulanță'}</div>
                  </div>
                </div>
                
                {assignedUser && (
                  <div className="assigned-user mt-2 mb-2 p-2" style={{ background: '#f8f9fa', borderRadius: '4px' }}>
                    <div className="d-flex align-items-center">
                      <FontAwesomeIcon icon={faUser} className="me-2" style={{ color: '#28a745' }} />
                      <span className="small">{assignedUser.name}</span>
                    </div>
                    <div className="small text-muted d-flex align-items-center mt-1 ps-4">
                      <FontAwesomeIcon icon={faClock} className="me-1" />
                      <span>{getWorkDuration(assignedUser.workStartTime)}</span>
                    </div>
                  </div>
                )}
                
                <div className="vehicle-details mt-2">
                  <div className="small text-muted">
                    <div className="mb-1">
                      <FontAwesomeIcon icon={faLocationArrow} className="me-1" />
                      {vehicle.Address || 'Locație necunoscută'}
                    </div>
                    <div>Viteză: {vehicle.Speed || 0} km/h</div>
                    {vehicle.GpsDate && (
                      <div>
                        Ultima actualizare: {
                          new Date(vehicle.GpsDate).toLocaleString()
                        }
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VehicleList;