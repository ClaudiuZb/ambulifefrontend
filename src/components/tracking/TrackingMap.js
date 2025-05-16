import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSelector } from 'react-redux';
import { renderToStaticMarkup } from 'react-dom/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAmbulance, faUser, faClock } from '@fortawesome/free-solid-svg-icons';

// Resolving Leaflet icon issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Folosim iconița default din Leaflet pentru backup
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

// Creăm o iconița personalizată folosind FontAwesome
const createCustomIcon = (color = '#FF4136') => {
  const iconMarkup = renderToStaticMarkup(
    <div style={{ 
      color: color, 
      fontSize: '24px',
      filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5))',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '35px',
      height: '35px'
    }}>
      <FontAwesomeIcon icon={faAmbulance} />
    </div>
  );

  return L.divIcon({
    html: iconMarkup,
    className: 'custom-ambulance-icon',
    iconSize: [35, 35],
    iconAnchor: [17, 20],
    popupAnchor: [0, -20]
  });
};

// Creăm iconițele pentru ambulanțe
const ambulanceIcon = createCustomIcon('#007BFF'); // albastru
const assignedAmbulanceIcon = createCustomIcon('#28a745'); // verde pentru ambulanțe cu asistent asignat

// Component to update map center when the center prop changes
const MapCenter = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

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

const TrackingMap = ({ positions = [], loading = false, selectedVehicle, activeUsers = [] }) => {
  const { user } = useSelector(state => state.auth);
  
  // Default map center (Romania)
  const [mapCenter, setMapCenter] = useState([47.6635, 26.2732]); // Suceava coordinates as default
  const [zoom, setZoom] = useState(10);
  const mapRef = useRef(null);

  // Debug logs
  useEffect(() => {
    console.log('TrackingMap - activeUsers:', activeUsers);
    console.log('TrackingMap - positions:', positions);
    
    // Verifică care vehicule au asistenți asignați
    if (activeUsers.length > 0 && positions.length > 0) {
      positions.forEach(vehicle => {
        const assignedUser = activeUsers.find(user => 
          user.activeVehicle && 
          (user.activeVehicle._id === vehicle.VehicleId || 
           user.activeVehicle === vehicle.VehicleId ||
           (user.activeVehicle.imei && user.activeVehicle.imei === vehicle.VehicleId.toString()))
        );
        
        if (assignedUser) {
          console.log(`Vehicul ${vehicle.VehicleRegistrationNumber} are asignat asistentul ${assignedUser.name}`);
        }
      });
    }
  }, [activeUsers, positions]);

  // Update map center when we have positions
  useEffect(() => {
    if (positions.length > 0) {
      // Find the first position with valid coordinates
      const firstValidPosition = positions.find(pos => 
        pos.Latitude && pos.Longitude
      );
      
      if (firstValidPosition) {
        setMapCenter([
          firstValidPosition.Latitude,
          firstValidPosition.Longitude
        ]);
        setZoom(12);
      }
    }
  }, [positions]);
  
  // Update map center when selected vehicle changes
  useEffect(() => {
    if (selectedVehicle && selectedVehicle.Latitude && selectedVehicle.Longitude) {
      setMapCenter([
        selectedVehicle.Latitude,
        selectedVehicle.Longitude
      ]);
      setZoom(15); // Zoom in closer when selecting a specific vehicle
    }
  }, [selectedVehicle]);

  if (loading) {
    return (
      <div className="map-container">
        <h5 className="mb-3">Tracking ambulanțe în timp real</h5>
        <div className="map-placeholder d-flex align-items-center justify-content-center" style={{ height: '500px', background: '#f0f0f0', borderRadius: '5px' }}>
          <div className="spinner-border text-primary me-2" role="status"></div>
          <span>Se încarcă harta...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      <h5 className="mb-3">Tracking ambulanțe în timp real</h5>
      
      <div style={{ height: '500px', borderRadius: '5px', overflow: 'hidden' }}>
        <MapContainer 
          center={mapCenter} 
          zoom={zoom} 
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <MapCenter center={mapCenter} zoom={zoom} />
          
          {positions.map(vehicle => {
            // Make sure we have valid position data
            if (!vehicle.Latitude || !vehicle.Longitude) {
              return null;
            }
            
            // Verificăm dacă vehiculul este asignat unui asistent
            const assignedUser = activeUsers.find(user => 
              user.activeVehicle && 
              (
                // Verificăm diverse posibilități de asociere
                (typeof user.activeVehicle === 'string' && user.activeVehicle === vehicle.VehicleId) ||
                (typeof user.activeVehicle === 'string' && user.activeVehicle === vehicle.VehicleId.toString()) ||
                (typeof user.activeVehicle === 'object' && user.activeVehicle._id === vehicle.VehicleId) ||
                (typeof user.activeVehicle === 'object' && user.activeVehicle._id === vehicle.VehicleId.toString()) ||
                (typeof user.activeVehicle === 'object' && user.activeVehicle.imei === vehicle.VehicleId.toString())
              )
            );
            
            // Folosim iconița verde pentru vehicule asignate, albastră pentru celelalte
            const markerIcon = assignedUser ? assignedAmbulanceIcon : ambulanceIcon;
            
            if (assignedUser) {
              console.log(`Render: Vehicul ${vehicle.VehicleRegistrationNumber} are asignat asistentul ${assignedUser.name}`);
            }
            
            return (
              <Marker 
                key={vehicle.VehicleId || Math.random().toString()}
                position={[vehicle.Latitude, vehicle.Longitude]}
                icon={markerIcon}
              >
                <Popup>
                  <div>
                    <h6>{vehicle.VehicleRegistrationNumber || vehicle.VehicleName}</h6>
                    
                    {assignedUser && (
                      <div className="assistant-info mt-2 mb-2">
                        <div className="d-flex align-items-center mb-1">
                          <FontAwesomeIcon icon={faUser} className="me-2" style={{ color: '#28a745' }} />
                          <strong>Asistent medical:</strong>
                        </div>
                        <div className="ps-4">
                          <div>{assignedUser.name}</div>
                          <div className="small text-muted d-flex align-items-center mt-1">
                            <FontAwesomeIcon icon={faClock} className="me-1" />
                            Durată tură: {getWorkDuration(assignedUser.workStartTime)}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <p>
                      <strong>Viteză:</strong> {vehicle.Speed || 0} km/h
                    </p>
                    <p>
                      <strong>Adresă:</strong> {vehicle.Address || 'Necunoscută'}
                    </p>
                    <p>
                      <strong>Ultima actualizare:</strong> {new Date(vehicle.GpsDate).toLocaleString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default TrackingMap;