import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/actions/authActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTachometerAlt, 
  faMapMarkerAlt, 
  faCommentAlt,
  faAmbulance,
  faHospital,
  faHeartbeat,
  faCalendarAlt,
  faGasPump,
  faWallet,
  faUsers,
  faSignOutAlt,
  faMedkit,
  faTools,
  faWrench,
  faUserMd
} from '@fortawesome/free-solid-svg-icons';

const AdminSidebar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const isMechanic = user && user.role === 'mechanic';

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="sidebar">
      <div className="brand-wrapper">
        <div className="brand-name">Ambu-Life</div>
      </div>
      
      <div className="category-header">General</div>
      <ul className="nav flex-column">
        <li className="nav-item">
          {/* Linkul către dashboard depinde de rolul utilizatorului */}
          <Link to={isMechanic ? "/mechanic/dashboard" : "/dashboard"} 
                className={`nav-link ${location.pathname === '/dashboard' || location.pathname === '/mechanic/dashboard' ? 'active' : ''}`}>
            <FontAwesomeIcon icon={faTachometerAlt} />
            <span className="nav-text">Dashboard</span>
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/tracking" className={`nav-link ${location.pathname === '/tracking' ? 'active' : ''}`}>
            <FontAwesomeIcon icon={faMapMarkerAlt} />
            <span className="nav-text">Tracking</span>
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/chat" className={`nav-link ${location.pathname === '/chat' ? 'active' : ''}`}>
            <FontAwesomeIcon icon={faCommentAlt} />
            <span className="nav-text">Chat</span>
          </Link>
        </li>
      </ul>
      
      {/* Afișăm secțiunea de servicii doar dacă utilizatorul nu este mecanic */}
      {!isMechanic && (
        <>
          <div className="category-header">Servicii</div>
          <ul className="nav flex-column">
            <li className="nav-item">
              <Link to="/services/private" className={`nav-link ${location.pathname === '/services/private' ? 'active' : ''}`}>
                <FontAwesomeIcon icon={faAmbulance} />
                <span className="nav-text">Servicii Private</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/services/cnas" className={`nav-link ${location.pathname === '/services/cnas' ? 'active' : ''}`}>
                <FontAwesomeIcon icon={faHospital} />
                <span className="nav-text">Servicii CNAS</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/services/pncc" className={`nav-link ${location.pathname === '/services/pncc' ? 'active' : ''}`}>
                <FontAwesomeIcon icon={faHeartbeat} />
                <span className="nav-text">Servicii PNCC</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/services/events" className={`nav-link ${location.pathname === '/services/events' ? 'active' : ''}`}>
                <FontAwesomeIcon icon={faCalendarAlt} />
                <span className="nav-text">Evenimente</span>
              </Link>
            </li>
          </ul>
        </>
      )}
      
      {/* Secțiune specială pentru mecanici */}
      {isMechanic && (
        <>
          <div className="category-header">Mentenanță</div>
          <ul className="nav flex-column">
            <li className="nav-item">
              <Link to="/mechanic/service" className={`nav-link ${location.pathname.includes('/mechanic/service') ? 'active' : ''}`}>
                <FontAwesomeIcon icon={faTools} />
                <span className="nav-text">Service Ambulanțe</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/mechanic/dashboard" className={`nav-link ${location.pathname === '/mechanic/dashboard' ? 'active' : ''}`}>
                <FontAwesomeIcon icon={faWrench} />
                <span className="nav-text">Rapoarte Tehnice</span>
              </Link>
            </li>
          </ul>
        </>
      )}
      
      <div className="category-header">Management</div>
      <ul className="nav flex-column">
        <li className="nav-item">
          <Link to="/management/fuel" className={`nav-link ${location.pathname === '/management/fuel' ? 'active' : ''}`}>
            <FontAwesomeIcon icon={faGasPump} />
            <span className="nav-text">Carburant</span>
          </Link>
        </li>
        {!isMechanic && (
          <>
            <li className="nav-item">
              <Link to="/management/cash-flow" className={`nav-link ${location.pathname === '/management/cash-flow' ? 'active' : ''}`}>
                <FontAwesomeIcon icon={faWallet} />
                <span className="nav-text">Cash Flow</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/management/medicaments" className={`nav-link ${location.pathname === '/management/medicaments' ? 'active' : ''}`}>
                <FontAwesomeIcon icon={faMedkit} />
                <span className="nav-text">Evidență Medicamente</span>
              </Link>
            </li>
          </>
        )}
        <li className="nav-item">
          <Link to={isMechanic ? "/mechanic/service" : "/management/service"} 
               className={`nav-link ${location.pathname === '/management/service' || location.pathname.includes('/mechanic/service') ? 'active' : ''}`}>
            <FontAwesomeIcon icon={faTools} />
            <span className="nav-text">Service Ambulanțe</span>
          </Link>
        </li>
        {user && user.role === 'admin' && (
          <li className="nav-item">
            <Link to="/users" className={`nav-link ${location.pathname === '/users' ? 'active' : ''}`}>
              <FontAwesomeIcon icon={faUsers} />
              <span className="nav-text">Utilizatori</span>
            </Link>
          </li>
        )}
        <li className="nav-item mt-5">
          <Link to="#!" onClick={handleLogout} className="nav-link">
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span className="nav-text">Deconectare</span>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default AdminSidebar;