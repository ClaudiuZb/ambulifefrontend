import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/actions/authActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faMapMarkerAlt,
  faCommentAlt,
  faAmbulance,
  faHospital,
  faHeartbeat,
  faCalendarAlt,
  faGasPump,
  faWallet,
  faSignOutAlt,
  faMedkit,
  faTools,
  faWrench,
  faCarCrash
} from '@fortawesome/free-solid-svg-icons';

const AssistantSidebar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="sidebar">
      <div className="brand-wrapper">
        <div className="brand-name">Ambu-Life</div>
      </div>
      
      <div className="user-info">
        <div className="user-name">{user?.firstName} {user?.lastName}</div>
        <div className="user-role">Asistent Medical • {user?.city?.name || 'Necunoscut'}</div>
      </div>
      
      <ul className="nav flex-column">
        <li className="nav-item">
          <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            <FontAwesomeIcon icon={faHome} />
            <span className="nav-text">Acasă</span>
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
      
      <div className="category-header">Management</div>
      <ul className="nav flex-column">
        <li className="nav-item">
          <Link to="/management/fuel" className={`nav-link ${location.pathname === '/management/fuel' ? 'active' : ''}`}>
            <FontAwesomeIcon icon={faGasPump} />
            <span className="nav-text">Carburant</span>
          </Link>
        </li>
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
        <li className="nav-item">
          <Link to="/management/service" className={`nav-link ${location.pathname === '/management/service' ? 'active' : ''}`}>
            <FontAwesomeIcon icon={faTools} />
            <span className="nav-text">Service Ambulanțe</span>
          </Link>
        </li>
      </ul>
      
      <ul className="nav flex-column mt-5">
        <li className="nav-item">
          <Link to="#!" onClick={handleLogout} className="nav-link">
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span className="nav-text">Deconectare</span>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default AssistantSidebar;
      