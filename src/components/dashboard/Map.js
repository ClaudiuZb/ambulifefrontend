import React from 'react';

// Placeholder pentru hartă până implementăm Leaflet
const Map = ({ title }) => {
  return (
    <div className="map-container">
      <h5 className="mb-3">{title || 'Tracking ambulanțe în timp real'}</h5>
      <div className="map-placeholder">
        <i className="fas fa-map-marked-alt me-2"></i> Hartă integrată cu TrackGPS
      </div>
    </div>
  );
};

export default Map;