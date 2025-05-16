import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Form, Alert, Spinner, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faCity, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

const ImportVehiclesWithCities = ({ onImportComplete }) => {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [cities, setCities] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // La încărcare, obține vehiculele din TrackGPS și orașele din baza de date
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Obține vehiculele din TrackGPS
      const vehiclesRes = await axios.get('/api/tracking/vehicles');
      
      // Obține orașele din baza de date
      const citiesRes = await axios.get('/api/cities');
      
      if (vehiclesRes.data.success && citiesRes.data.success) {
        // Adaugă câmpul 'cityId' la fiecare vehicul
        const trackGpsVehicles = vehiclesRes.data.data.map(vehicle => ({
          ...vehicle,
          cityId: '' // Inițial gol, va fi setat de utilizator
        }));
        
        setVehicles(trackGpsVehicles);
        setCities(citiesRes.data.data);
      }
    } catch (err) {
      console.error('Eroare la obținerea datelor:', err);
      setError('Eroare la obținerea vehiculelor și orașelor');
    } finally {
      setLoading(false);
    }
  };

  // Actualizează orașul pentru un vehicul
  const handleCityChange = (vehicleId, cityId) => {
    setVehicles(prevVehicles =>
      prevVehicles.map(vehicle =>
        vehicle.VehicleId === vehicleId ? { ...vehicle, cityId } : vehicle
      )
    );
  };

  // Setează același oraș pentru toate vehiculele
  const setAllCities = (cityId) => {
    setVehicles(prevVehicles =>
      prevVehicles.map(vehicle => ({ ...vehicle, cityId }))
    );
  };

  // Setează orasul specific pentru anumite mașini
  const setSpecificCities = () => {
    // Găsește ID-urile orașelor
    const botosaniCity = cities.find(city => city.name === 'Botoșani');
    const suceavaCity = cities.find(city => city.name === 'Suceava');
    
    if (!botosaniCity || !suceavaCity) {
      setError('Nu au fost găsite orașele Botoșani și/sau Suceava');
      return;
    }
    
    // Setează toate vehiculele la Suceava
    setAllCities(suceavaCity._id);
    
    // Apoi, pentru SV88 și SV93, setează Botoșani
    setVehicles(prevVehicles =>
      prevVehicles.map(vehicle => {
        if (vehicle.VehicleRegistrationNumber && 
            (vehicle.VehicleRegistrationNumber.includes('SV88') || 
             vehicle.VehicleRegistrationNumber.includes('SV93'))) {
          return { ...vehicle, cityId: botosaniCity._id };
        }
        return vehicle;
      })
    );
  };

  // Importă vehiculele în baza de date cu orașele selectate
  const importVehicles = async () => {
    // Verifică dacă toate vehiculele au orașe selectate
    if (vehicles.some(vehicle => !vehicle.cityId)) {
      setError('Toate vehiculele trebuie să aibă un oraș selectat');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Pregătește datele pentru import
      const vehiclesToImport = vehicles.map(vehicle => ({
        name: vehicle.VehicleName || `Ambulanță ${vehicle.VehicleRegistrationNumber}`,
        registrationNumber: vehicle.VehicleRegistrationNumber,
        imei: vehicle.VehicleId.toString(),
        cityId: vehicle.cityId,
        isActive: true,
        type: 'ambulance',
        status: 'active'
      }));
      
      console.log('==================== LOGS DE DEBUG ====================');
      console.log('[Import] Vehicule pregătite pentru import:', vehiclesToImport);
      
      // Trimite cererea de import
      console.log('[Import] Trimit cerere POST la /api/tracking/import-vehicles-manual');
      const res = await axios.post('/api/tracking/import-vehicles-manual', { vehicles: vehiclesToImport });
      
      console.log('[Import] Răspuns primit:', res.data);
      
      if (res.data.success) {
        setResult(res.data);
        
        // Notifică componenta părinte că importul s-a finalizat
        console.log('[Import] Import reușit, notific componenta părinte');
        if (onImportComplete) {
          onImportComplete();
        }
      } else {
        console.error('[Import] Eroare în răspunsul API:', res.data);
        setError(res.data.message || 'Eroare la import');
      }
    } catch (err) {
      console.error('[Import] Eroare la importul vehiculelor:', err);
      console.error('[Import] Detalii eroare:', err.response?.data);
      setError(err.response?.data?.message || 'Eroare la importul vehiculelor');
    } finally {
      setLoading(false);
    }
  };

  if (loading && vehicles.length === 0) {
    return (
      <div className="text-center">
        <Spinner animation="border" role="status" />
        <p className="mt-2">Se încarcă vehiculele...</p>
      </div>
    );
  }

  return (
    <div className="vehicle-import-container">
      <h5 className="mb-3">
        <FontAwesomeIcon icon={faDownload} className="me-2" />
        Import Vehicule cu Selectare Oraș
      </h5>
      
      {error && (
        <Alert variant="danger" className="mb-3">
          <FontAwesomeIcon icon={faTimes} className="me-2" />
          {error}
        </Alert>
      )}
      
      {result && (
        <Alert variant="success" className="mb-3">
          <FontAwesomeIcon icon={faCheck} className="me-2" />
          {result.message}
        </Alert>
      )}
      
      {vehicles.length === 0 ? (
        <Alert variant="info">
          Nu există vehicule disponibile pentru import.
        </Alert>
      ) : (
        <>
          <div className="mb-3">
            <Form.Group>
              <Form.Label>
                <FontAwesomeIcon icon={faCity} className="me-2" />
                Setează oraș pentru toate vehiculele:
              </Form.Label>
              <Form.Select 
                onChange={(e) => setAllCities(e.target.value)}
              >
                <option value="">-- Selectează oraș --</option>
                {cities.map(city => (
                  <option key={city._id} value={city._id}>{city.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Button 
              variant="outline-primary" 
              className="mt-2"
              onClick={setSpecificCities}
            >
              Setează SV88, SV93 → Botoșani, Restul → Suceava
            </Button>
          </div>
          
          <Table responsive striped bordered hover>
            <thead>
              <tr>
                <th>Număr Înmatriculare</th>
                <th>Nume</th>
                <th>Oraș</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(vehicle => (
                <tr key={vehicle.VehicleId}>
                  <td>{vehicle.VehicleRegistrationNumber}</td>
                  <td>{vehicle.VehicleName || 'Ambulanță'}</td>
                  <td>
                    <Form.Select 
                      value={vehicle.cityId}
                      onChange={(e) => handleCityChange(vehicle.VehicleId, e.target.value)}
                      isInvalid={!vehicle.cityId}
                    >
                      <option value="">-- Selectează oraș --</option>
                      {cities.map(city => (
                        <option key={city._id} value={city._id}>{city.name}</option>
                      ))}
                    </Form.Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          <Button 
            variant="primary" 
            onClick={importVehicles}
            disabled={loading || vehicles.some(v => !v.cityId)}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Se importă...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faDownload} className="me-2" />
                Importă Vehiculele
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
};

export default ImportVehiclesWithCities;