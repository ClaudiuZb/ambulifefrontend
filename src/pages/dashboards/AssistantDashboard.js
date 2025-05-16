import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRoute, 
  faAmbulance, 
  faTasks,
  faUserClock,
  faCity,
  faCalendarCheck,
  faFileAlt,
  faGasPump,
  faMoneyBillWave
} from '@fortawesome/free-solid-svg-icons';
import AssignVehicle from '../../components/dashboard/AssignVehicle';

const AssistantDashboard = () => {
  const { user } = useSelector(state => state.auth);
  const [myServices, setMyServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDistance: 0,
    completedServices: { total: 0, private: 0, cnas: 0 },
    scheduledServices: { total: 0, nextIn: 0 }
  });
  
  // Folosim useNavigate în loc de useHistory în React Router v6
  const navigate = useNavigate();

  // Funcții pentru navigare
  const handleAddPrivateTransport = () => {
    navigate('/services/private');
  };
  
  const handleAddCnasDocument = () => {
    navigate('/services/cnas');
  };
  
  const handleAddFuel = () => {
    navigate('/management/fuel');
  };
  
  const handleAddCashFlow = () => {
    navigate('/management/cash-flow');
  };

  // Debugger function pentru console
  const debugApiData = async () => {
    try {
      console.log('=== DEBUGGING API DATA ===');
      console.log('User:', user);
      
      // Verificăm ce returnează API-urile fără filtre
      const privateRes = await axios.get('/api/private-services?limit=5');
      console.log('Private Services (first 5):', privateRes.data);
      
      const cnasRes = await axios.get('/api/cnas-services?limit=5');
      console.log('CNAS Services (first 5):', cnasRes.data);
      
      // Verificăm structura datelor
      if (privateRes.data && privateRes.data.data && privateRes.data.data.length > 0) {
        const firstPrivate = privateRes.data.data[0];
        console.log('Private service structure example:', {
          id: firstPrivate._id,
          status: firstPrivate.status,
          assignedTo: firstPrivate.assignedTo,
          pickupPoint: firstPrivate.pickupPoint || firstPrivate.pickupAddress,
          dropoffPoint: firstPrivate.dropoffPoint || firstPrivate.dropoffAddress
        });
      }
      
      // Verificăm numărul total de servicii
      const privateCountRes = await axios.get('/api/private-services?limit=1000');
      console.log('Total private services:', privateCountRes.data?.data?.length || 0);
      
      console.log('Current Stats:', stats);
      console.log('Current Services:', myServices);
      console.log('=== END DEBUGGING ===');
    } catch (err) {
      console.error('Error during API debugging:', err);
    }
  };

  // Obținem cursele recente finalizate
  useEffect(() => {
    const fetchRecentServices = async () => {
      setLoading(true);
      try {
        console.log('Începem încărcarea datelor pentru user:', user?.name);
        
        // Obținem serviciile fără filtrare după utilizator
        const privateServicesRes = await axios.get(`/api/private-services?limit=50`)
          .catch(err => {
            console.error('Eroare la obținerea serviciilor private:', err);
            return { data: { success: true, data: [] } };
          });

        const cnasServicesRes = await axios.get(`/api/cnas-services?limit=50`)
          .catch(err => {
            console.error('Eroare la obținerea serviciilor CNAS:', err);
            return { data: { success: true, data: [] } };
          });

        // Combinăm serviciile și le sortăm după data finalizării
        let allServices = [];
        
        if (privateServicesRes?.data?.success && privateServicesRes?.data?.data && Array.isArray(privateServicesRes.data.data)) {
          // Filtrăm doar după status completed, fără a verifica utilizatorul
          const privateServices = privateServicesRes.data.data
            .filter(service => {
              // Verificăm doar statusul
              return service.status === 'completed' || 
                    service.status === 'finalizat' || 
                    service.status === 'completat';
            })
            .map(service => ({
              _id: service._id,
              type: 'private',
              icon: faAmbulance,
              iconBgColor: 'var(--primary-color)',
              title: 'Transport privat finalizat',
              info: `${service.pickupPoint || service.pickupAddress || ''} → ${service.dropoffPoint || service.dropoffAddress || ''}`,
              amount: service.amount ? `${service.amount} Lei` : '',
              date: new Date(service.completedAt || service.date || new Date()),
              cityName: (service.city && typeof service.city === 'object') ? 
                service.city.name : 
                (typeof service.city === 'string' ? service.city : 'Necunoscut')
            }));
          
          console.log('Servicii private finalizate:', privateServices.length);
          allServices = [...allServices, ...privateServices];
        }
        
        if (cnasServicesRes?.data?.success && cnasServicesRes?.data?.data && Array.isArray(cnasServicesRes.data.data)) {
          // Filtrăm doar după status completed, fără a verifica utilizatorul
          const cnasServices = cnasServicesRes.data.data
            .filter(service => {
              // Verificăm doar statusul
              return service.status === 'completed' || 
                    service.status === 'finalizat' || 
                    service.status === 'completat';
            })
            .map(service => ({
              _id: service._id,
              type: 'cnas',
              icon: faAmbulance,
              iconBgColor: 'var(--info-color)',
              title: 'Serviciu CNAS finalizat',
              info: `${service.pickupPoint || service.pickupAddress || ''} → ${service.dropoffPoint || service.dropoffAddress || ''}`,
              amount: '',
              date: new Date(service.completedAt || service.date || new Date()),
              cityName: (service.city && typeof service.city === 'object') ? 
                service.city.name : 
                (typeof service.city === 'string' ? service.city : 'Necunoscut')
            }));
          
          console.log('Servicii CNAS finalizate:', cnasServices.length);
          allServices = [...allServices, ...cnasServices];
        }
        
        // Sortăm serviciile după dată (cele mai recente primele)
        allServices.sort((a, b) => b.date - a.date);
        console.log('Total servicii după filtrare:', allServices.length);

        // Limităm la primele 10 servicii
        setMyServices(allServices.slice(0, 10));

        // Pentru statistici, folosim date hardcodate temporar
        setStats({
          totalDistance: 354, 
          completedServices: {
            total: privateServicesRes?.data?.data?.filter(s => 
              s.status === 'completed' || s.status === 'finalizat' || s.status === 'completat'
            )?.length || 0,
            private: privateServicesRes?.data?.data?.filter(s => 
              s.status === 'completed' || s.status === 'finalizat' || s.status === 'completat'
            )?.length || 0,
            cnas: cnasServicesRes?.data?.data?.filter(s => 
              s.status === 'completed' || s.status === 'finalizat' || s.status === 'completat'
            )?.length || 0
          },
          scheduledServices: {
            total: privateServicesRes?.data?.data?.filter(s => s.status === 'pending')?.length || 0 + 
                  cnasServicesRes?.data?.data?.filter(s => s.status === 'pending')?.length || 0,
            nextIn: 0
          }
        });
      } catch (err) {
        console.error('Eroare generală la obținerea serviciilor:', err);
        console.error('Stack trace:', err.stack);
        
        // Setăm valori implicite pentru a asigura că interfața nu se blochează
        setMyServices([]);
        setStats({
          totalDistance: 354,
          completedServices: {
            total: 0,
            private: 0,
            cnas: 0
          },
          scheduledServices: {
            total: 0,
            nextIn: 0
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRecentServices();
    
    // Actualizăm datele la fiecare 2 minute
    const interval = setInterval(fetchRecentServices, 120000);
    return () => clearInterval(interval);
  }, [user]);

  // Funcție pentru a formata cursele recente
  const renderRecentServicesItems = () => {
    if (loading) {
      return (
        <div className="text-center py-3">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2">Se încarcă cursele recente...</p>
        </div>
      );
    }
    
    if (myServices.length === 0) {
      return (
        <div className="text-center py-3">
          <p className="text-muted">Nu există curse finalizate.</p>
        </div>
      );
    }
    
    return myServices.map(service => (
      <div className="mb-3 p-3 border rounded" key={service._id}>
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <div className="me-3" style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              backgroundColor: service.iconBgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <FontAwesomeIcon icon={service.icon} />
            </div>
            <div>
              <div className="fw-bold">{service.title}</div>
              <div className="text-muted small">{service.info}</div>
              <div className="text-muted small">
                <FontAwesomeIcon icon={faCity} className="me-1" />
                {service.cityName}
              </div>
              <div className="text-muted small">
                <FontAwesomeIcon icon={faCalendarCheck} className="me-1" />
                {service.date.toLocaleDateString('ro-RO', {day: '2-digit', month: '2-digit', year: 'numeric'})}
                {' '}
                {service.date.toLocaleTimeString('ro-RO', {hour: '2-digit', minute: '2-digit'})}
              </div>
            </div>
          </div>
          {service.amount && (
            <div className="fw-bold text-success">{service.amount}</div>
          )}
        </div>
      </div>
    ));
  };

  // Funcție pentru a afișa StatCard direct în pagină
  const renderStatCard = (icon, value, label, footer, iconBgColor) => {
    return (
      <div className="content-card mb-4">
        <div className="d-flex align-items-center">
          <div className="me-3" style={{ 
            width: '45px', 
            height: '45px', 
            borderRadius: '50%', 
            backgroundColor: iconBgColor || 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <FontAwesomeIcon icon={icon} />
          </div>
          <div>
            <h3 className="mb-0" style={{ fontWeight: 'bold' }}>{value}</h3>
            <p className="text-muted mb-0">{label}</p>
          </div>
        </div>
        <hr />
        <div className="text-muted small">
          {footer}
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="mb-0">Bună, {user?.name?.split(' ')[0] || 'Asistent'}!</h1>
          <p className="text-muted">Bine ai venit în aplicația Ambu-Life</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="row">
        <div className="col-md-4">
          {renderStatCard(
            faRoute,
            `${stats.totalDistance} km`,
            "Total kilometri parcurși astăzi",
            <span>Echipa {user?.city?.name || 'Suceava'}</span>,
            "var(--accent-color)"
          )}
        </div>
        <div className="col-md-4">
          {renderStatCard(
            faAmbulance,
            loading ? "Se încarcă..." : stats.completedServices.total.toString(),
            "Transporturi efectuate astăzi",
            <span>{stats.completedServices.private} private, {stats.completedServices.cnas} CNAS</span>,
            "var(--primary-color)"
          )}
        </div>
        <div className="col-md-4">
          {renderStatCard(
            faTasks,
            loading ? "Se încarcă..." : stats.scheduledServices.total.toString(),
            "Transporturi programate",
            stats.scheduledServices.nextIn > 0 ? (
              <><FontAwesomeIcon icon={faUserClock} className="me-1" /> Următorul în {stats.scheduledServices.nextIn} min</>
            ) : (
              <span>Niciun transport programat</span>
            ),
            "var(--warning-color)"
          )}
        </div>
      </div>

      {/* Assign Vehicle component */}
      <AssignVehicle />

      {/* Acțiuni Rapide cu navigare */}
      <div className="row">
        <div className="col-12">
          <h5 className="mt-4 mb-3">Acțiuni rapide</h5>
          <div className="d-flex flex-wrap gap-2">
            <button 
              className="btn btn-outline-primary"
              onClick={handleAddPrivateTransport}
            >
              <FontAwesomeIcon icon={faAmbulance} className="me-2" />
              Adaugă Transport Privat
            </button>
            
            <button 
              className="btn btn-outline-info"
              onClick={handleAddCnasDocument}
            >
              <FontAwesomeIcon icon={faFileAlt} className="me-2" />
              Adaugă Document CNAS
            </button>
            
            <button 
              className="btn btn-outline-warning"
              onClick={handleAddFuel}
            >
              <FontAwesomeIcon icon={faGasPump} className="me-2" />
              Încarcă Bon Carburant
            </button>
            
            <button 
              className="btn btn-outline-success"
              onClick={handleAddCashFlow}
            >
              <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
              Înregistrează Cash Flow
            </button>
          </div>
        </div>
      </div>

      {/* Recent Services */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="content-card">
            <h5 className="mb-3">Curse recente</h5>
            {renderRecentServicesItems()}
          </div>
        </div>
      </div>
      
      {/* Debug Button - doar în development */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="row mt-4">
          <div className="col-12">
            <button 
              className="btn btn-secondary" 
              onClick={debugApiData}
            >
              Debug API Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssistantDashboard;