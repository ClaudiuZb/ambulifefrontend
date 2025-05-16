import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearErrors } from '../redux/actions/authActions';
import { setAlert } from '../redux/actions/uiActions';
import Alert from '../components/common/Alert';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faAmbulance } from '@fortawesome/free-solid-svg-icons';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const { email, password } = formData;
  const { isAuthenticated, error, loading } = useSelector(state => state.auth);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect if authenticated
    if (isAuthenticated) {
      navigate('/dashboard');
    }
    
    // Show alert if there's an error
    if (error) {
      dispatch(setAlert(error, 'danger'));
      dispatch(clearErrors());
    }
    
    // eslint-disable-next-line
  }, [isAuthenticated, error]);
  
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const onSubmit = e => {
    e.preventDefault();
    
    if (!email || !password) {
      dispatch(setAlert('Vă rugăm completați toate câmpurile', 'danger'));
    } else {
      dispatch(login(email, password));
    }
  };
  
  return (
    <div style={{ 
      backgroundColor: 'var(--bg-dark)', 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      <Alert />
      
      <div className="content-card" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="text-center mb-4">
          <FontAwesomeIcon icon={faAmbulance} size="3x" style={{ color: 'var(--accent-color)' }} />
          <h1 className="mt-3 mb-3" style={{ color: 'var(--text-light)' }}>Ambu-Life</h1>
          <p style={{ color: 'var(--text-light)' }}>Autentificare în sistemul de management</p>
        </div>
        
        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label" style={{ color: 'var(--text-light)' }}>Email</label>
            <div className="input-group">
              <span className="input-group-text">
                <FontAwesomeIcon icon={faUser} />
              </span>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={email}
                onChange={onChange}
                placeholder="Introduceți email-ul"
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="form-label" style={{ color: 'var(--text-light)' }}>Parolă</label>
            <div className="input-group">
              <span className="input-group-text">
                <FontAwesomeIcon icon={faLock} />
              </span>
              <input
                type="password"
                className="form-control"
                id="password"
                name="password"
                value={password}
                onChange={onChange}
                placeholder="Introduceți parola"
                required
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary w-100" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Se procesează...
              </>
            ) : 'Autentificare'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;