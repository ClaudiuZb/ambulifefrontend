import React, { useState } from 'react';
import axios from 'axios';
import { Button, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

const ImportVehiclesButton = ({ onImportComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleImport = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Facem un POST la endpoint-ul pentru importul vehiculelor
      const response = await axios.post('/api/tracking/import-vehicles');
      
      if (response.data.success) {
        setResult(response.data);
        
        // Notificăm componenta părinte că importul s-a finalizat
        if (onImportComplete && typeof onImportComplete === 'function') {
          onImportComplete();
        }
      } else {
        setError(response.data.message || 'Eroare la importul vehiculelor');
      }
    } catch (err) {
      console.error('Eroare la importul vehiculelor:', err);
      setError(err.response?.data?.message || 'Eroare la importul vehiculelor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button 
        variant="warning" 
        onClick={handleImport} 
        disabled={isLoading}
        className="d-flex align-items-center"
      >
        {isLoading ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            <span>Se importă vehiculele...</span>
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faDownload} className="me-2" />
            <span>Import automat vehicule TrackGPS</span>
          </>
        )}
      </Button>
      
      {result && (
        <Alert variant="success" className="mt-3">
          <div className="d-flex align-items-center mb-2">
            <FontAwesomeIcon icon={faCheck} className="me-2" style={{ color: '#28a745' }} />
            <h6 className="mb-0">Import finalizat cu succes!</h6>
          </div>
          <p>{result.message}</p>
          
          {result.stats && (
            <div className="mt-2 pt-2 border-top">
              <div><strong>Total vehicule în TrackGPS:</strong> {result.stats.total}</div>
              <div><strong>Vehicule existente în baza de date:</strong> {result.stats.existing}</div>
              <div><strong>Vehicule noi adăugate:</strong> {result.stats.created}</div>
            </div>
          )}
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" className="mt-3">
          <div className="d-flex align-items-center mb-2">
            <FontAwesomeIcon icon={faTimes} className="me-2" style={{ color: '#dc3545' }} />
            <h6 className="mb-0">Eroare la import</h6>
          </div>
          <p>{error}</p>
        </Alert>
      )}
    </div>
  );
};

export default ImportVehiclesButton;