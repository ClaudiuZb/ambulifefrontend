import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addUser, getUser, updateUser, clearUser } from '../../redux/actions/userActions';
import Layout from '../../components/layout/Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import Spinner from '../../components/layout/Spinner';
import axios from 'axios';

const UserForm = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user, loading } = useSelector(state => state.user);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'assistant',
    city: '',
    phone: ''
  });
  
  useEffect(() => {
    // Încarcă orașele
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const res = await axios.get('/api/cities');
        setCities(res.data.data);
      } catch (err) {
        console.error('Eroare la obținerea orașelor:', err);
      }
      setLoadingCities(false);
    };
    
    fetchCities();
    
    // Încarcă utilizatorul pentru modul de editare
    if (isEditMode) {
      dispatch(getUser(id));
    } else {
      dispatch(clearUser());
    }
    
    return () => {
      dispatch(clearUser());
    };
  }, [dispatch, id, isEditMode]);
  
  useEffect(() => {
    // Populează formularul cu datele utilizatorului în modul de editare
    if (isEditMode && user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', // Nu preluăm parola din server
        role: user.role || 'assistant',
        city: user.city?._id || '',
        phone: user.phone || ''
      });
    }
  }, [isEditMode, user]);
  
  const { name, email, password, role, city, phone } = formData;
  
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    
    try {
      if (isEditMode) {
        // Creăm un obiect care conține doar câmpurile modificate
        const updatedData = { ...formData };
        // Dacă parola este goală, o eliminăm din cerere
        if (!updatedData.password) delete updatedData.password;
        
        await dispatch(updateUser(id, updatedData));
      } else {
        await dispatch(addUser(formData));
      }
      
      navigate('/users');
    } catch (err) {
      console.error('Eroare:', err);
    }
  };
  
  if (loading || (isEditMode && !user) || loadingCities) {
    return <Layout><Spinner /></Layout>;
  }
  
  return (
    <Layout>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>{isEditMode ? 'Editare Utilizator' : 'Adăugare Utilizator Nou'}</h1>
        </div>
        
        <div className="content-card">
          <form onSubmit={onSubmit}>
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="name" className="form-label">Nume Complet</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={name}
                  onChange={onChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  required
                />
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="password" className="form-label">
                  {isEditMode ? 'Parolă (lăsați gol pentru a păstra parola actuală)' : 'Parolă'}
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  name="password"
                  value={password}
                  onChange={onChange}
                  required={!isEditMode}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="role" className="form-label">Rol</label>
                <select
                  className="form-select"
                  id="role"
                  name="role"
                  value={role}
                  onChange={onChange}
                  required
                >
                  <option value="admin">Administrator</option>
                  <option value="assistant">Asistent Medical</option>
                  <option value="mechanic">Mecanic</option>
                </select>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="city" className="form-label">Oraș</label>
                <select
                  className="form-select"
                  id="city"
                  name="city"
                  value={city}
                  onChange={onChange}
                  required={role !== 'admin'}
                  disabled={role === 'admin'}
                >
                  <option value="">Selectează orașul</option>
                  {cities.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                {role === 'admin' && (
                  <small className="text-muted">Administratorii au acces global, nu necesită un oraș.</small>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="phone" className="form-label">Telefon</label>
                <input
                  type="text"
                  className="form-control"
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={onChange}
                />
              </div>
            </div>
            
            <div className="d-flex justify-content-end mt-4">
              <button
                type="button"
                className="btn btn-secondary me-2"
                onClick={() => navigate('/users')}
              >
                <FontAwesomeIcon icon={faTimes} className="me-2" />
                Anulează
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                <FontAwesomeIcon icon={faSave} className="me-2" />
                {isEditMode ? 'Salvează modificările' : 'Adaugă utilizator'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default UserForm;