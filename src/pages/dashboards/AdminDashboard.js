import React from 'react';
import { useSelector } from 'react-redux';
import CityFilter from '../../components/dashboard/CityFilter';
import ServiceItem from '../../components/common/ServiceItem';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faAmbulance, 
  faMoneyBillWave, 
  faRoute, 
  faUsers,
  faPlus,
  faMinus,
  faGasPump,
  faCalendarAlt,
  faCity
} from '@fortawesome/free-solid-svg-icons';
import VehiclesTable from '../../components/tracking/VehiclesTable';

const AdminDashboard = () => {
  const { user } = useSelector(state => state.auth);
  const [trackGpsVehicles, setTrackGpsVehicles] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [cashFlowData, setCashFlowData] = useState([]);
  const [fuelData, setFuelData] = useState([]);
  const [recentServices, setRecentServices] = useState([]);
  
  const [stats, setStats] = useState({
    privateServices: { count: 0, increase: 0 },
    privateIncome: { amount: 0, increase: 0 },
    totalDistance: { value: 0 },
    activeAssistants: { count: 0, cities: {} }
  });
  
  const [loading, setLoading] = useState({
    tracking: true,
    cashFlow: true,
    fuel: true,
    services: true,
    stats: true
  });

  useEffect(() => {
    const fetchStatsData = async () => {
      setLoading(prev => ({ ...prev, stats: true }));
      try {
        // În loc să folosim endpoint-ul de stats, obținem toate serviciile private
        // și le numărăm direct
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        
        // Obținem toate serviciile private (fără limit)
        const privateServicesRes = await axios.get('/api/private-services?sort=-date&limit=1000')
          .catch(err => {
            console.warn('Eroare la obținerea serviciilor private:', err);
            return { data: { success: true, data: [] } };
          });
          
        let currentMonthCount = 0;
        let previousMonthCount = 0;
        let currentMonthTotal = 0;
        let previousMonthTotal = 0;
        
        // Procesăm serviciile pentru a calcula statisticile
        if (privateServicesRes?.data?.success && privateServicesRes?.data?.data) {
          const services = privateServicesRes.data.data;
          
          services.forEach(service => {
            const serviceDate = new Date(service.date);
            const serviceMonth = serviceDate.getMonth();
            const serviceYear = serviceDate.getFullYear();
            
            // Verificăm dacă serviciul este din luna curentă
            if (serviceMonth === currentMonth && serviceYear === currentYear) {
              currentMonthCount++;
              currentMonthTotal += Number(service.amount) || 0;
            }
            // Verificăm dacă serviciul este din luna anterioară
            else if (serviceMonth === previousMonth && serviceYear === previousMonthYear) {
              previousMonthCount++;
              previousMonthTotal += Number(service.amount) || 0;
            }
          });
        }
        
        // Calculăm procentajele de creștere
        const countIncrease = previousMonthCount > 0 
          ? Math.round(((currentMonthCount - previousMonthCount) / previousMonthCount) * 100) 
          : 0;
          
        const incomeIncrease = previousMonthTotal > 0 
          ? Math.round(((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100) 
          : 0;
        
        // Calculăm numărul de asistenți activi și distribuția lor pe orașe
        let activeAssistantCount = 0;
        let assistantCities = {};
        
        if (activeUsers && activeUsers.length > 0) {
          activeAssistantCount = activeUsers.filter(user => user.isWorking).length;
          
          activeUsers.filter(user => user.isWorking).forEach(user => {
            const cityName = user.city && typeof user.city === 'object' ? user.city.name : 'Necunoscut';
            assistantCities[cityName] = (assistantCities[cityName] || 0) + 1;
          });
        }
        
        // Actualizăm starea cu datele calculate
        setStats({
          privateServices: {
            count: currentMonthCount || 0,
            increase: countIncrease
          },
          privateIncome: {
            amount: currentMonthTotal || 0,
            increase: incomeIncrease
          },
          totalDistance: {
            value: 765
          },
          activeAssistants: {
            count: activeAssistantCount || 0,
            cities: Object.keys(assistantCities).length > 0 ? assistantCities : { 'Suceava': 0, 'Botoșani': 0 }
          }
        });
      } catch (err) {
        console.error('Eroare generală la obținerea statisticilor:', err);
        setStats({
          privateServices: { count: 0, increase: 0 },
          privateIncome: { amount: 0, increase: 0 },
          totalDistance: { value: 765 },
          activeAssistants: { count: 0, cities: { 'Suceava': 0, 'Botoșani': 0 } }
        });
      } finally {
        setLoading(prev => ({ ...prev, stats: false }));
      }
    };
    
    fetchStatsData();
    
    const interval = setInterval(fetchStatsData, 120000);
    return () => clearInterval(interval);
  }, [activeUsers]);

  useEffect(() => {
    const fetchTrackingData = async () => {
      setLoading(prev => ({ ...prev, tracking: true }));
      try {
        const vehiclesRes = await axios.get('/api/tracking/vehicles');
        if (vehiclesRes.data.success) {
          setTrackGpsVehicles(vehiclesRes.data.data || []);
        }
        
        const usersRes = await axios.get('/api/tracking/active-users');
        if (usersRes.data.success) {
          setActiveUsers(usersRes.data.data || []);
        }
      } catch (err) {
        console.error('Eroare la obținerea datelor de tracking:', err);
      } finally {
        setLoading(prev => ({ ...prev, tracking: false }));
      }
    };
    
    fetchTrackingData();
    
    const interval = setInterval(fetchTrackingData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchServicesData = async () => {
      setLoading(prev => ({ ...prev, services: true }));
      
      try {
        const [privateServicesRes, cnasServicesRes, eventServicesRes] = await Promise.all([
          axios.get('/api/private-services?limit=2&sort=-date'),
          axios.get('/api/cnas-services?limit=2&sort=-date'),
          axios.get('/api/event-services?limit=2&sort=-date')
        ]);
        
        let allServices = [];
        
        if (privateServicesRes.data.success && privateServicesRes.data.data) {
          const privateServices = privateServicesRes.data.data.map(service => ({
            _id: service._id,
            type: 'private',
            icon: faAmbulance,
            iconBgColor: 'var(--primary-color)',
            title: 'Transport privat',
            info: `${service.pickupPoint} → ${service.dropoffPoint}`,
            amount: `${service.amount} Lei`,
            date: new Date(service.date),
            cityName: service.city && typeof service.city === 'object' ? service.city.name : 'Necunoscut'
          }));
          
          allServices = [...allServices, ...privateServices];
        }
        
        if (cnasServicesRes.data.success && cnasServicesRes.data.data) {
          const cnasServices = cnasServicesRes.data.data.map(service => ({
            _id: service._id,
            type: 'cnas',
            icon: faAmbulance,
            iconBgColor: 'var(--info-color)',
            title: 'Serviciu CNAS',
            info: `${service.pickupPoint} → ${service.dropoffPoint}`,
            amount: '',
            date: new Date(service.date),
            cityName: service.city && typeof service.city === 'object' ? service.city.name : 'Necunoscut'
          }));
          
          allServices = [...allServices, ...cnasServices];
        }
        
        if (eventServicesRes.data.success && eventServicesRes.data.data) {
          const events = eventServicesRes.data.data.map(event => ({
            _id: event._id,
            type: 'event',
            icon: faCalendarAlt,
            iconBgColor: 'var(--success-color)',
            title: `Eveniment: ${event.eventName}`,
            info: event.notes || '',
            amount: '',
            date: new Date(event.date),
            cityName: event.city && typeof event.city === 'object' ? event.city.name : 'Necunoscut'
          }));
          
          allServices = [...allServices, ...events];
        }
        
        allServices.sort((a, b) => b.date - a.date);
        
        setRecentServices(allServices.slice(0, 4));
      } catch (err) {
        console.error('Eroare la obținerea serviciilor recente:', err);
      } finally {
        setLoading(prev => ({ ...prev, services: false }));
      }
    };
    
    fetchServicesData();
    
    const interval = setInterval(fetchServicesData, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchCashFlowData = async () => {
      setLoading(prev => ({ ...prev, cashFlow: true }));
      try {
        const response = await axios.get('/api/cash-flow');
        
        if (response.data && response.data.data) {
          const formattedData = response.data.data
            .slice(0, 4)
            .map(record => ({
              id: record._id,
              icon: record.type === 'income' ? faPlus : faMinus,
              title: record.description,
              info: record.city?.name ? `${record.info || ''}, ${record.city.name}` : record.info || '',
              amount: record.type === 'income' ? `+${record.amount} Lei` : `-${record.amount} Lei`,
              iconBgColor: record.type === 'income' ? 'var(--success-color)' : 'var(--accent-color)'
            }));
          
          setCashFlowData(formattedData);
        }
      } catch (err) {
        console.error('Eroare la obținerea datelor Cash Flow:', err);
      } finally {
        setLoading(prev => ({ ...prev, cashFlow: false }));
      }
    };
    
    fetchCashFlowData();
    
    const interval = setInterval(fetchCashFlowData, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchFuelData = async () => {
      setLoading(prev => ({ ...prev, fuel: true }));
      try {
        const response = await axios.get('/api/fuel');
        
        if (response.data && response.data.data) {
          const formattedData = response.data.data
            .filter(record => record.type === 'fuelConsumption')
            .slice(0, 4)
            .map(record => ({
              id: record._id,
              icon: faGasPump,
              title: record.vehicle?.plateNumber || 'N/A',
              info: `${record.gasStation}, ${record.info || (Math.round(record.amount / 7))} litri`,
              amount: `-${record.amount} Lei`,
              iconBgColor: 'var(--primary-color)'
            }));
          
          setFuelData(formattedData);
        }
      } catch (err) {
        console.error('Eroare la obținerea datelor Fuel:', err);
      } finally {
        setLoading(prev => ({ ...prev, fuel: false }));
      }
    };
    
    fetchFuelData();
    
    const interval = setInterval(fetchFuelData, 120000);
    return () => clearInterval(interval);
  }, []);

  const renderRecentServicesItems = () => {
    if (loading.services) {
      return (
        <div className="text-center py-3">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2">Se încarcă serviciile recente...</p>
        </div>
      );
    }
    
    if (recentServices.length === 0) {
      return (
        <div className="text-center py-3">
          <p className="text-muted">Nu există servicii recente.</p>
        </div>
      );
    }
    
    return recentServices.map(service => (
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
            </div>
          </div>
          {service.amount && (
            <div className="fw-bold text-success">{service.amount}</div>
          )}
        </div>
      </div>
    ));
  };
  
  const formatActiveAssistantsFooter = () => {
    const { cities } = stats.activeAssistants;
    const cityEntries = Object.entries(cities);
    
    if (cityEntries.length === 0) {
      return "0 în Suceava, 0 în Botoșani";
    }
    
    return cityEntries
      .map(([city, count]) => `${count} în ${city}`)
      .join(', ');
  };

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
  
  const debugApiCalls = async () => {
    console.log('Debugging API calls...');
    
    try {
      // Verificăm API-ul pentru servicii private
      const privateServicesRes = await axios.get('/api/private-services?limit=5');
      console.log('Private Services Response (first 5):', privateServicesRes);
      
      // Numărăm total servicii private
      const allServicesRes = await axios.get('/api/private-services?limit=1000');
      console.log('Total private services:', allServicesRes?.data?.data?.length || 0);
      
      // Verificăm și pentru cash-flow
      const cashFlowRes = await axios.get('/api/cash-flow?limit=5');
      console.log('Cash Flow Response (first 5):', cashFlowRes);
      
      console.log('Current stats state:', stats);
    } catch (err) {
      console.error('Error during debugging:', err);
    }
  };
  
  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="mb-0">Dashboard</h1>
          <p className="text-muted">Bine ai venit în panoul de administrare Ambu-Life</p>
        </div>
      </div>
      
      <CityFilter />
      
      <div className="row">
        <div className="col-md-3">
          {renderStatCard(
            faAmbulance,
            loading.stats ? "Se încarcă..." : stats.privateServices.count.toString(),
            "Total curse private",
            loading.stats ? (
              <span>Se calculează...</span>
            ) : (
              <><i className="fas fa-arrow-up me-1"></i> {stats.privateServices.increase}% față de luna trecută</>
            ),
            "var(--primary-color)"
          )}
        </div>
        <div className="col-md-3">
          {renderStatCard(
            faMoneyBillWave,
            loading.stats ? "Se încarcă..." : `${stats.privateIncome.amount.toLocaleString()} Lei`,
            "Total încasat curse private",
            loading.stats ? (
              <span>Se calculează...</span>
            ) : (
              <><i className="fas fa-arrow-up me-1"></i> {stats.privateIncome.increase}% față de luna trecută</>
            ),
            "var(--secondary-color)"
          )}
        </div>
        <div className="col-md-3">
          {renderStatCard(
            faRoute,
            `${stats.totalDistance.value} km`,
            "Total kilometri parcurși",
            <span>Se resetează la miezul nopții</span>,
            "var(--accent-color)"
          )}
        </div>
        <div className="col-md-3">
          {renderStatCard(
            faUsers,
            loading.stats ? "Se încarcă..." : stats.activeAssistants.count.toString(),
            "Asistenți activi",
            loading.stats ? (
              <span>Se calculează...</span>
            ) : (
              <span>{formatActiveAssistantsFooter()}</span>
            ),
            "var(--success-color)"
          )}
        </div>
      </div>
      
      <div className="row">
        <div className="col-lg-8">
          <VehiclesTable 
            positions={trackGpsVehicles}
            loading={loading.tracking}
            activeUsers={activeUsers}
          />
        </div>
        <div className="col-lg-4">
          <div className="content-card">
            <h5 className="mb-3">Servicii recente</h5>
            {renderRecentServicesItems()}
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-lg-6">
          <div className="recent-services">
            <h5 className="mb-3">Cash Flow Recent</h5>
            
            {loading.cashFlow ? (
              <div className="text-center py-3">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2">Se încarcă datele...</p>
              </div>
            ) : cashFlowData.length > 0 ? (
              cashFlowData.map((item, index) => (
                <ServiceItem 
                  key={item.id || index}
                  icon={item.icon}
                  title={item.title}
                  info={item.info}
                  amount={item.amount}
                  iconBgColor={item.iconBgColor}
                />
              ))
            ) : (
              <>
                <ServiceItem 
                  icon={faPlus}
                  title="Încasare - Transport Privat"
                  info="Ion Popescu, Suceava"
                  amount="+450 Lei"
                  iconBgColor="var(--success-color)"
                />
                
                <ServiceItem 
                  icon={faMinus}
                  title="Cheltuială - Consumabile"
                  info="Farmacia Central, Botoșani"
                  amount="-120 Lei"
                  iconBgColor="var(--accent-color)"
                />
                
                <ServiceItem 
                  icon={faPlus}
                  title="Încasare - Eveniment"
                  info="Maraton Suceava"
                  amount="+800 Lei"
                  iconBgColor="var(--success-color)"
                />
                
                <ServiceItem 
                  icon={faMinus}
                  title="Cheltuială - Reparații"
                  info="Service Auto, Suceava"
                  amount="-350 Lei"
                  iconBgColor="var(--accent-color)"
                />
              </>
            )}
          </div>
        </div>
        <div className="col-lg-6">
          <div className="recent-services">
            <h5 className="mb-3">Alimentări Recente</h5>
            
            {loading.fuel ? (
              <div className="text-center py-3">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2">Se încarcă datele...</p>
              </div>
            ) : fuelData.length > 0 ? (
              fuelData.map((item, index) => (
                <ServiceItem 
                  key={item.id || index}
                  icon={item.icon}
                  title={item.title}
                  info={item.info}
                  amount={item.amount}
                  iconBgColor={item.iconBgColor}
                />
              ))
            ) : (
              <>
                <ServiceItem 
                  icon={faGasPump}
                  title="SV-01-AMB"
                  info="OMV Suceava, 45 litri"
                  amount="-320 Lei"
                  iconBgColor="var(--primary-color)"
                />
                
                <ServiceItem 
                  icon={faGasPump}
                  title="BT-02-AMB"
                  info="Petrom Botoșani, 40 litri"
                  amount="-280 Lei"
                  iconBgColor="var(--primary-color)"
                />
                
                <ServiceItem 
                  icon={faGasPump}
                  title="SV-03-AMB"
                  info="MOL Suceava, 50 litri"
                  amount="-350 Lei"
                  iconBgColor="var(--primary-color)"
                />
                
                <ServiceItem 
                  icon={faGasPump}
                  title="BT-01-AMB"
                  info="Rompetrol Botoșani, 35 litri"
                  amount="-250 Lei"
                  iconBgColor="var(--primary-color)"
                />
              </>
            )}
          </div>
        </div>
      </div>
      
      {process.env.NODE_ENV !== 'production' && (
        <div className="row mt-4">
          <div className="col-12">
            <button 
              className="btn btn-secondary" 
              onClick={debugApiCalls}
            >
              Debug API Calls
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;