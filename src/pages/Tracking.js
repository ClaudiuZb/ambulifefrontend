import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import Layout from '../components/layout/Layout';
import TrackingMap from '../components/tracking/TrackingMap';
import VehicleList from '../components/tracking/VehicleList';
import ImportVehiclesWithCities from '../components/vehicles/ImportVehiclesWithCities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSync, 
  faMapMarkedAlt, 
  faSearch,
  faExclamationTriangle,
  faInfoCircle,
  faUserClock,
  faUser,
  faClock
} from '@fortawesome/free-solid-svg-icons';

const Tracking = () => {
  const [trackGpsVehicles, setTrackGpsVehicles] = useState([]);
  const [dbVehicles, setDbVehicles] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const [cacheAge, setCacheAge] = useState(null);
  const [needsImport, setNeedsImport] = useState(false);
  const requestPendingRef = useRef(false);
  const updateIntervalRef = useRef(null);
  const { user } = useSelector(state => state.auth);
  
  // Funcție throttled pentru a limita rata de cereri
  const fetchTrackGpsData = async (force = false) => {
    // Dacă o cerere este deja în curs, nu mai facem alta
    if (requestPendingRef.current && !force) {
      console.log('O cerere este deja în curs. Se ignoră noua cerere.');
      return;
    }
    
    setLoading(true);
    requestPendingRef.current = true;
    
    try {
      console.log('Obținere vehicule TrackGPS...');
      const res = await axios.get('/api/tracking/vehicles');
      console.log('Vehicule TrackGPS:', res.data);
      
      if (res.data.success) {
        setTrackGpsVehicles(res.data.data || []);
        setLastUpdated(new Date());
        setError(null);
        setFromCache(res.data.fromCache || false);
        setCacheAge(res.data.cacheAge || 0);
        
        // Verifică dacă avem vehiculele în baza de date
        fetchDbVehicles(res.data.data || []);
      } else {
        setError('Nu s-au putut obține vehiculele TrackGPS');
      }
    } catch (err) {
      console.error('Eroare la obținerea vehiculelor TrackGPS:', err);
      setError(err.response?.data?.message || 'Eroare la obținerea vehiculelor TrackGPS');
      
      // Dacă avem deja date, păstrăm datele vechi
      if (trackGpsVehicles.length > 0) {
        console.log('Păstrăm datele vechi pentru că serverul a returnat eroare');
      }
    } finally {
      setLoading(false);
      requestPendingRef.current = false;
    }
  };
  
  // Obține vehiculele din baza de date
  const fetchDbVehicles = async (trackGpsVehiclesData = null) => {
    try {
      const res = await axios.get('/api/vehicles');
      
      if (res.data.success) {
        setDbVehicles(res.data.data || []);
        
        // Verifică dacă avem nevoie de import
        if (trackGpsVehiclesData) {
          // Dacă avem vehicule în TrackGPS dar nu în baza de date
          setNeedsImport(
            trackGpsVehiclesData.length > 0 && 
            res.data.data.length === 0
          );
        }
      }
    } catch (err) {
      console.error('Eroare la obținerea vehiculelor din baza de date:', err);
    }
  };
  
  // Obține utilizatorii activi și vehiculele lor
  const fetchActiveUsers = async () => {
    try {
      const res = await axios.get('/api/tracking/active-users');
      
      if (res.data.success) {
        console.log("Active users:", res.data.data);
        setActiveUsers(res.data.data || []);
      }
    } catch (err) {
      console.error('Eroare la obținerea utilizatorilor activi:', err);
    }
  };

  // Inițializare și configurare interval cu rate limiting
  useEffect(() => {
    // Încarcă datele inițial
    fetchTrackGpsData();
    fetchActiveUsers();
    
    // Setează un interval pentru actualizări - la fiecare 60 secunde
    // Aceasta este o rată sigură care respectă limita API-ului (1/30s)
    updateIntervalRef.current = setInterval(() => {
      fetchTrackGpsData();
      fetchActiveUsers();
    }, 60000); // 60 secunde
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  // Handler pentru importul realizat cu succes
  const handleImportComplete = () => {
    // Reîncarcă vehiculele din baza de date
    fetchDbVehicles();
    // Forțează o nouă cerere către TrackGPS
    fetchTrackGpsData(true);
    // Setează needsImport pe false
    setNeedsImport(false);
  };

  // Filtrează vehiculele după termenul de căutare
  const filteredVehicles = trackGpsVehicles.filter(vehicle => {
    // Filtrare doar după termen de căutare, fără filtrare după oraș
    return searchTerm === '' ||
      (vehicle.VehicleName && vehicle.VehicleName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vehicle.VehicleRegistrationNumber && vehicle.VehicleRegistrationNumber.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // Tratează click pe vehicul din listă
  const handleVehicleClick = (vehicle) => {
    setSelectedVehicle(vehicle);
  };
  
  // Formatare timp trecut de la ultima actualizare
  const formatTimeAgo = (date) => {
    if (!date) return '';
    
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return `acum ${seconds} secunde`;
    if (seconds < 3600) return `acum ${Math.floor(seconds / 60)} minute`;
    if (seconds < 86400) return `acum ${Math.floor(seconds / 3600)} ore`;
    return `acum ${Math.floor(seconds / 86400)} zile`;
  };

  return (
    <Layout>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>
            <FontAwesomeIcon icon={faMapMarkedAlt} className="me-2" />
            Tracking Ambulanțe
          </h1>
          <div>
            <button 
              className="btn btn-primary" 
              onClick={() => fetchTrackGpsData(true)}
              disabled={loading || requestPendingRef.current}
            >
              <FontAwesomeIcon icon={faSync} className={loading ? "me-2 fa-spin" : "me-2"} />
              Reîmprospătează
            </button>
          </div>
        </div>
        
        {loading && trackGpsVehicles.length === 0 && (
          <div className="alert alert-info">
            <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
            Se încarcă datele...
          </div>
        )}
        
        {error && (
          <div className="alert alert-warning">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            {error}
            {trackGpsVehicles.length > 0 && (
              <span> (Se afișează ultimele date disponibile)</span>
            )}
          </div>
        )}
        
        {!error && fromCache && (
          <div className="alert alert-info">
            <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
            Datele sunt din cache-ul serverului. Vechime cache: {cacheAge ? `${Math.round(cacheAge)} secunde` : 'necunoscută'}
          </div>
        )}
        
        {/* Componenta de import cu orașe când există vehicule în TrackGPS dar nu în baza de date */}
        {needsImport && user.role === 'admin' && (
          <div className="content-card mb-4">
            <ImportVehiclesWithCities onImportComplete={handleImportComplete} />
          </div>
        )}
        
        {lastUpdated && (
          <div className="text-muted mb-3">
            <small>
              <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
              Ultima actualizare: {formatTimeAgo(lastUpdated)} ({lastUpdated.toLocaleTimeString()})
            </small>
          </div>
        )}

        {/* Secțiunea de căutare */}
        <div className="content-card mb-4">
          <div className="row align-items-center">
            <div className="col-12">
              <label className="form-label">
                <FontAwesomeIcon icon={faSearch} className="me-2" />
                Caută vehicul
              </label>
              <input 
                type="text"
                className="form-control"
                placeholder="Număr înmatriculare sau nume vehicul"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Secțiunea de asistenți activi - doar pentru admin */}
        {user.role === 'admin' && activeUsers.length > 0 && (
          <div className="content-card mb-4">
            <h5 className="mb-3">
              <FontAwesomeIcon icon={faUserClock} className="me-2" />
              Asistenți Activi
            </h5>
            <div className="row">
              {activeUsers.map(activeUser => (
                <div key={activeUser._id} className="col-lg-4 col-md-6 mb-3">
                  <div className="p-3" style={{ background: 'var(--bg-card-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    <div className="d-flex align-items-center">
                      <div className="me-3" style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        background: 'var(--success-color)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: 'white' 
                      }}>
                        <FontAwesomeIcon icon={faUser} />
                      </div>
                      <div>
                        <h6 className="mb-0">{activeUser.name}</h6>
                        <div className="text-muted small">
                          {activeUser.city?.name || 'Necunoscut'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2 pt-2 border-top">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="small">
                          <strong>Vehicul:</strong> {activeUser.activeVehicle?.name || 'N/A'}
                        </div>
                        <div className="small text-muted d-flex align-items-center">
                          <FontAwesomeIcon icon={faClock} className="me-1" />
                          {activeUser.workStartTime ? (
                            <>
                              {new Date(activeUser.workStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </>
                          ) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Hartă și Lista de vehicule */}
        <div className="row">
          <div className="col-lg-8 mb-4 mb-lg-0">
            <TrackingMap 
              positions={filteredVehicles}
              loading={loading && trackGpsVehicles.length === 0}
              selectedVehicle={selectedVehicle}
              activeUsers={activeUsers}
            />
          </div>
          
          <div className="col-lg-4">
            <VehicleList 
              positions={filteredVehicles}
              loading={loading && trackGpsVehicles.length === 0}
              onVehicleClick={handleVehicleClick}
              activeUsers={activeUsers}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Tracking;