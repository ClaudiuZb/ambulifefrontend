import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/actions/authActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

const MechanicSidebar = () => {
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
        <div className="user-role">Mecanic • {user?.city?.name || 'Necunoscut'}</div>
      </div>

      <ul className="nav flex-column">
        <li className="nav-item">
          <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            <FontAwesomeIcon icon={faHome} />
            <span className="nav-text">Acasă</span>
          </Link>
        </li>
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

export default MechanicSidebar;