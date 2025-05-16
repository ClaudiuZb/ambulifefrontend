import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTruck, faLocationArrow, faUser, faClock, faMapMarkedAlt } from '@fortawesome/free-solid-svg-icons';

const VehiclesTable = ({ positions = [], loading = false, activeUsers = [] }) => {
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

  // Funcție îmbunătățită pentru a găsi asistentul asignat unui vehicul
  const findAssignedUser = (vehicle) => {
    // Verificăm toate posibilitățile de asociere a vehiculului cu un asistent
    return activeUsers.find(user => 
      user.activeVehicle && (
        // Verificăm după ID
        (typeof user.activeVehicle === 'string' && user.activeVehicle === vehicle.VehicleId) ||
        (typeof user.activeVehicle === 'string' && user.activeVehicle === vehicle.VehicleId.toString()) ||
        (typeof user.activeVehicle === 'object' && user.activeVehicle._id === vehicle.VehicleId) ||
        (typeof user.activeVehicle === 'object' && user.activeVehicle._id === vehicle.VehicleId.toString()) ||
        (typeof user.activeVehicle === 'object' && user.activeVehicle.imei === vehicle.VehicleId.toString()) ||
        
        // Verificăm după numărul de înmatriculare
        (typeof user.activeVehicle === 'object' && 
         user.activeVehicle.registrationNumber === vehicle.VehicleRegistrationNumber) ||
        
        // Verificăm după trackGpsVehicleId
        (typeof user.activeVehicle === 'object' && 
         user.activeVehicle.trackGpsVehicleId === vehicle.VehicleId) ||
         
        // Verificare simplă după numele vehiculului/numărul de înmatriculare
        (typeof user.activeVehicle === 'object' && 
         user.activeVehicle.name === vehicle.VehicleRegistrationNumber)
      )
    );
  };
  
  // Debug: verificăm cum sunt asociați asistenții vehiculelor
  console.log('Active Users:', activeUsers);
  console.log('Vehicles:', positions);
  
  if (loading) {
    return (
      <div className="content-card">
        <div className="table-header">
          <FontAwesomeIcon icon={faMapMarkedAlt} />
          Tracking ambulanțe în timp real
        </div>
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2">Se încarcă vehiculele...</p>
        </div>
      </div>
    );
  }
   
  return (
    <div className="content-card vehicles-table-container" style={{ minHeight: '500px' }}>
      <div className="table-header">
        <FontAwesomeIcon icon={faMapMarkedAlt} />
        Tracking ambulanțe în timp real
      </div>
      
      {positions.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted">Nu există vehicule disponibile.</p>
        </div>
      ) : (
        <div className="table-responsive" style={{ maxHeight: '450px', overflowY: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Vehicul</th>
                <th>Locație</th>
                <th>Ultima actualizare</th>
                <th>Asistent</th>
                <th>Durată tură</th>
              </tr>
            </thead>
            <tbody>
              {positions.map(vehicle => {
                const assignedUser = findAssignedUser(vehicle);
                
                // Debug: verificăm asocierea pentru fiecare vehicul
                if (vehicle.VehicleRegistrationNumber === 'SV03LIF') {
                  console.log('SV03LIF AssignedUser:', assignedUser);
                  console.log('SV03LIF Vehicle data:', vehicle);
                }
                
                return (
                  <tr key={vehicle.VehicleId || Math.random().toString()}>
                    <td>
                      <div className="vehicle-cell">
                        <div className="vehicle-icon me-2" style={{ 
                          backgroundColor: assignedUser ? 'var(--success-color)' : 'var(--secondary-color)'
                        }}>
                          <FontAwesomeIcon icon={faTruck} size="sm" />
                        </div>
                        <div>
                          <div className="vehicle-reg">{vehicle.VehicleRegistrationNumber || "Necunoscut"}</div>
                          <div className="vehicle-name">{vehicle.VehicleName || 'Ambulanță'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="location-cell">
                        <FontAwesomeIcon icon={faLocationArrow} className="location-icon" />
                        <span>{vehicle.Address || 'Locație necunoscută'}</span>
                      </div>
                    </td>
                    <td>
                      {vehicle.GpsDate ? new Date(vehicle.GpsDate).toLocaleString() : 'Necunoscută'}
                    </td>
                    <td>
                      {assignedUser ? (
                        <div className="assistant-cell">
                          <div className="assistant-icon">
                            <FontAwesomeIcon icon={faUser} size="xs" />
                          </div>
                          <span>{assignedUser.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted">Nealocat</span>
                      )}
                    </td>
                    <td>
                      {assignedUser ? (
                        <div className="d-flex align-items-center">
                          <FontAwesomeIcon icon={faClock} className="me-2 text-muted" />
                          <span>{getWorkDuration(assignedUser.workStartTime)}</span>
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VehiclesTable;