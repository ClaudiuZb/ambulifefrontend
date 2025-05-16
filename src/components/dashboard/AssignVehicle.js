import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../../redux/actions/authActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCar, faPlay, faStop, faClock } from '@fortawesome/free-solid-svg-icons';

const AssignVehicle = () => {
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workDuration, setWorkDuration] = useState(null);
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  // Obține vehiculele disponibile când se încarcă componenta
  useEffect(() => {
    if (!user.isWorking) {
      fetchAvailableVehicles();
    } else {
      // Calculează durata turei
      updateWorkDuration();
      // Setează un interval pentru a actualiza durata la fiecare minut
      const interval = setInterval(updateWorkDuration, 60000);
      return () => clearInterval(interval);
    }
  }, [user.isWorking, user.workStartTime]);

  // Obține detaliile vehiculului când utilizatorul are un vehicul asignat
  useEffect(() => {
    // Verifică dacă utilizatorul are un vehicul asignat
    if (user.activeVehicle) {
      console.log('============ ACTIVE VEHICLE DEBUG ============');
      console.log('Active vehicle from user state:', user.activeVehicle);
      
      // Verifică dacă activeVehicle este un ID sau un obiect
      if (typeof user.activeVehicle === 'string') {
        console.log('activeVehicle este doar un ID, obținem detaliile...');
        
        const fetchVehicleDetails = async () => {
          try {
            const res = await axios.get(`/api/vehicles/${user.activeVehicle}`);
            if (res.data.success) {
              console.log('Detalii vehicul obținute:', res.data.data);
              setVehicleDetails(res.data.data);
            }
          } catch (err) {
            console.error('Eroare la obținerea detaliilor vehiculului:', err);
          }
        };
        
        fetchVehicleDetails();
      } else {
        console.log('activeVehicle este un obiect complet:', user.activeVehicle);
        setVehicleDetails(user.activeVehicle);
      }
    }
  }, [user.activeVehicle]);

  // Funcție pentru a actualiza durata turei
  const updateWorkDuration = () => {
    if (user.workStartTime) {
      const startTime = new Date(user.workStartTime);
      const now = new Date();
      const diffMs = now - startTime;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      setWorkDuration(`${diffHrs}h ${diffMins}m`);
    }
  };

  // Obține vehiculele disponibile din baza de date
  const fetchAvailableVehicles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Facem un GET la endpoint-ul pentru vehicule disponibile
      const res = await axios.get('/api/tracking/available-vehicles');
      
      if (res.data.success) {
        console.log('Vehicule disponibile obținute:', res.data.data);
        setAvailableVehicles(res.data.data);
      } else {
        setError('Nu s-au putut obține vehiculele disponibile');
      }
    } catch (err) {
      console.error('Eroare la obținerea vehiculelor disponibile:', err);
      setError(err.response?.data?.message || 'Eroare la obținerea vehiculelor disponibile');
    } finally {
      setLoading(false);
    }
  };

  // Asignează vehiculul selectat asistentului
  const handleStartShift = async () => {
    if (!selectedVehicle) {
      setError('Vă rugăm să selectați un vehicul');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    console.log('============== ASSIGN VEHICLE CLIENT ==============');
    console.log('Selected vehicle ID:', selectedVehicle);
    
    try {
      const res = await axios.post('/api/tracking/assign-vehicle', {
        vehicleId: selectedVehicle
      });
      
      console.log('Response from server:', res.data);
      
      if (res.data.success) {
        console.log('Updating user in Redux...');
        console.log('Current user:', user);
        console.log('New activeVehicle:', res.data.data.user.activeVehicle);
        
        // Obține detaliile vehiculului
        let vehicleInfo = res.data.data.vehicle;
        
        // Actualizează starea utilizatorului în Redux
        dispatch(updateUser({
          ...user,
          activeVehicle: res.data.data.user.activeVehicle,
          isWorking: res.data.data.user.isWorking,
          workStartTime: res.data.data.user.workStartTime
        }));
        
        // Setează vehiculul asignat în starea locală
        setVehicleDetails(vehicleInfo);
        
        // Resetăm vehiculul selectat
        setSelectedVehicle('');
      } else {
        setError('Nu s-a putut asigna vehiculul');
      }
    } catch (err) {
      console.error('Eroare la asignarea vehiculului:', err);
      setError(err.response?.data?.message || 'Eroare la asignarea vehiculului');
    } finally {
      setLoading(false);
    }
  };

  // Eliberează vehiculul asignat
  const handleEndShift = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await axios.post('/api/tracking/release-vehicle');
      
      if (res.data.success) {
        // Actualizează starea utilizatorului în Redux
        dispatch(updateUser({
          ...user,
          activeVehicle: null,
          isWorking: false,
          workStartTime: null
        }));
        
        // Resetăm durata turei și detaliile vehiculului
        setWorkDuration(null);
        setVehicleDetails(null);
        
        // Reîncărcăm vehiculele disponibile
        fetchAvailableVehicles();
      } else {
        setError('Nu s-a putut finaliza tura');
      }
    } catch (err) {
      console.error('Eroare la finalizarea turei:', err);
      setError(err.response?.data?.message || 'Eroare la finalizarea turei');
    } finally {
      setLoading(false);
    }
  };

  // Dacă asistentul nu lucrează momentan, afișăm formularul de asignare vehicul
  if (!user.isWorking) {
    return (
      <div className="content-card mb-4">
        <h5 className="mb-3">
          <FontAwesomeIcon icon={faCar} className="me-2" />
          Începe tura
        </h5>
        
        {error && (
          <div className="alert alert-danger">{error}</div>
        )}
        
        <div className="row">
          <div className="col-md-8">
            <div className="form-group mb-3">
              <label className="form-label">Selectează vehicul</label>
              <select 
                className="form-select"
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                disabled={loading || availableVehicles.length === 0}
              >
                <option value="">-- Selectează vehicul --</option>
                {availableVehicles.map(vehicle => (
                  <option key={vehicle._id} value={vehicle._id}>
                    {vehicle.name || vehicle.plateNumber} ({vehicle.plateNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-4 d-flex align-items-end">
            <button
              className="btn btn-primary w-100"
              onClick={handleStartShift}
              disabled={loading || !selectedVehicle}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  <span>Se procesează...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPlay} className="me-2" />
                  Începe tura
                </>
              )}
            </button>
          </div>
        </div>
        
        {availableVehicles.length === 0 && !loading && (
          <div className="alert alert-warning mt-3">
            Nu există vehicule disponibile în acest moment.
          </div>
        )}
      </div>
    );
  }
  
  // Dacă asistentul lucrează deja, afișăm informații despre tura curentă
  return (
    <div className="content-card mb-4">
      <h5 className="mb-3">
        <FontAwesomeIcon icon={faCar} className="me-2" />
        Tură în desfășurare
      </h5>
      
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      
      <div className="vehicle-shift-info">
        <div className="row align-items-center">
          <div className="col-md-6">
            <div className="d-flex align-items-center">
              <div className="vehicle-icon me-3">
                <FontAwesomeIcon icon={faCar} size="2x" />
              </div>
              <div>
                <h6 className="mb-0">
                  {vehicleDetails?.name || user.activeVehicle?.name || 'Vehicul'}
                </h6>
                <div className="text-muted">
                  {vehicleDetails?.plateNumber || user.activeVehicle?.plateNumber || 'N/A'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-3">
            <div className="text-center">
              <div className="small text-muted mb-1">
                <FontAwesomeIcon icon={faClock} className="me-1" />
                Durată tură
              </div>
              <div className="fw-bold">{workDuration || '0h 0m'}</div>
            </div>
          </div>
          
          <div className="col-md-3">
            <button
              className="btn btn-danger w-100"
              onClick={handleEndShift}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  <span>Se procesează...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faStop} className="me-2" />
                  Finalizează tura
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignVehicle;