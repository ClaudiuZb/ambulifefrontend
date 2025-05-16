// pages/management/Medicaments.js
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faCalendarAlt,
  faSearch,
  faFilter,
  faEye,
  faSortAmountDown,
  faSync,
  faPlus,
  faPen,
  faTrash,
  faCity,
  faCheckCircle,
  faSpinner,
  faClock,
  faMedkit,
  faAmbulance,
  faUserNurse,
  faBuilding,
  faInfoCircle,
  faClipboardList
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import { Modal, Button, Form, Badge } from 'react-bootstrap';

const Medicaments = () => {
  const { user } = useSelector(state => state.auth);
  const isAdmin = user && user.role === 'admin';
  
  const [medicaments, setMedicaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicle: '',
    notes: '',
    cityId: '',
    status: 'pending'
  });

  const statusOptions = [
    { value: 'pending', label: 'În așteptare', color: 'warning' },
    { value: 'approved', label: 'Aprobat', color: 'success' },
    { value: 'rejected', label: 'Respins', color: 'danger' }
  ];
  
  useEffect(() => {
    if (user) {
      fetchVehicles();
      fetchCities();
    }
  }, [user]);
  
  useEffect(() => {
    if (user && vehicles.length > 0) {
      fetchMedicaments();
    }
  }, [user, vehicles]);
  
  const fetchMedicaments = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/medicaments');
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setMedicaments(response.data.data);
      } else {
        console.warn('Nu s-au găsit înregistrări de medicamente în răspunsul API-ului sau formatul datelor este incorect.');
        setMedicaments([]);
      }
      
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Eroare la încărcarea medicamentelor:', err);
      setError(err.response?.data?.message || 'Nu s-au putut obține înregistrările. Vă rugăm să reîncercați mai târziu.');
      setLoading(false);
      setMedicaments([]);
    }
  };
  
  const fetchCities = async () => {
    setLoadingCities(true);
    try {
      const response = await axios.get('/api/cities');
      
      if (response.data && response.data.data) {
        setCities(response.data.data);
        
        if (!isAdmin && user.city) {
          const userCityId = typeof user.city === 'object' ? user.city._id : user.city;
          setFormData(prevData => ({
            ...prevData,
            cityId: userCityId
          }));
        }
      } else {
        setCities([]);
      }
      
      setLoadingCities(false);
    } catch (err) {
      console.error('Eroare la încărcarea orașelor:', err);
      setCities([]);
      setLoadingCities(false);
    }
  };
  
  const fetchVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const response = await axios.get('/api/vehicles');
      
      if (response.data && response.data.data) {
        const allVehicles = response.data.data;
        
        // Filtrează vehiculele pentru a afișa doar ambulanțele
        const ambulances = allVehicles.filter(vehicle => 
          vehicle.type === 'ambulance' || 
          vehicle.type.toLowerCase().includes('ambulanță') ||
          vehicle.type.toLowerCase().includes('ambulanta')
        );
        
        const userCityId = user.city && typeof user.city === 'object' 
          ? user.city._id 
          : typeof user.city === 'string' 
            ? user.city 
            : null;
        
        const filteredVehicles = isAdmin 
          ? ambulances 
          : ambulances.filter(vehicle => {
              const vehicleCityId = vehicle.city && typeof vehicle.city === 'object' 
                ? vehicle.city._id 
                : typeof vehicle.city === 'string' 
                  ? vehicle.city 
                  : null;
              return vehicleCityId === userCityId;
            });
        
        setVehicles(filteredVehicles);
      } else {
        console.warn('Nu s-au găsit vehicule în răspunsul API-ului.');
        setVehicles([]);
      }
      
      setLoadingVehicles(false);
    } catch (err) {
      console.error('Eroare la încărcarea vehiculelor:', err);
      setVehicles([]);
      setLoadingVehicles(false);
    }
  };
  
  const filteredMedicaments = medicaments.filter(record => {
    const matchesSearch = 
      searchTerm === '' || 
      (record.notes && record.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCity = cityFilter === '' || (record.city && record.city.name === cityFilter);
    
    const matchesDate = dateFilter === '' || record.date.split('T')[0] === dateFilter;
    
    const matchesVehicle = vehicleFilter === '' || 
      (record.vehicle && record.vehicle._id === vehicleFilter);
    
    const matchesStatus = statusFilter === '' || record.status === statusFilter;
    
    return matchesSearch && matchesCity && matchesDate && matchesVehicle && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'asc' 
        ? dateA - dateB 
        : dateB - dateA;
    } else if (sortBy === 'vehicle') {
      const vehicleA = a.vehicle ? a.vehicle.plateNumber : '';
      const vehicleB = b.vehicle ? b.vehicle.plateNumber : '';
      return sortOrder === 'asc'
        ? vehicleA.localeCompare(vehicleB)
        : vehicleB.localeCompare(vehicleA);
    }
    return 0;
  });
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  const getStatusBadge = (status) => {
    const statusObj = statusOptions.find(s => s.value === status) || { label: 'Necunoscut', color: 'secondary' };
    return <Badge bg={statusObj.color}>{statusObj.label}</Badge>;
  };
  
  const handleViewRecord = (record) => {
    setCurrentRecord(record);
    setShowViewModal(true);
  };
  
  const handleAddNewRecord = () => {
    const initialFormData = {
      date: new Date().toISOString().split('T')[0],
      vehicle: '',
      notes: '',
      cityId: '',
      status: 'pending'
    };
    
    if (!isAdmin && user.city) {
      const userCityId = typeof user.city === 'object' ? user.city._id : user.city;
      initialFormData.cityId = userCityId;
    }
    
    setFormData(initialFormData);
    setShowAddModal(true);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleEditInit = (record) => {
    // Populăm formularul cu datele înregistrării existente
    setFormData({
      date: record.date.split('T')[0],
      vehicle: record.vehicle ? record.vehicle._id : '',
      notes: record.notes,
      cityId: record.city ? record.city._id : '',
      status: record.status
    });
    
    setRecordToEdit(record);
    setShowEditModal(true);
  };
  
  const handleDeleteInit = (record) => {
    setRecordToDelete(record);
    setShowDeleteConfirm(true);
  };
  
  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/medicaments/${recordToDelete._id}`);
      
      setMedicaments(medicaments.filter(r => r._id !== recordToDelete._id));
      setShowDeleteConfirm(false);
      setRecordToDelete(null);
      
      alert('Înregistrarea a fost ștearsă cu succes');
    } catch (err) {
      console.error('Eroare la ștergere:', err);
      alert(`Eroare: ${err.response?.data?.message || 'Nu s-a putut șterge înregistrarea'}`);
      setShowDeleteConfirm(false);
    }
  };
  
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.vehicle) {
        alert('Vă rugăm să selectați o ambulanță!');
        return;
      }
      
      if (!formData.cityId) {
        alert('Vă rugăm să selectați un oraș!');
        return;
      }
      
      if (!formData.notes.trim()) {
        alert('Vă rugăm să adăugați detalii despre medicamente!');
        return;
      }
      
      const recordData = {
        date: formData.date,
        vehicle: formData.vehicle,
        notes: formData.notes,
        city: formData.cityId,
        status: formData.status
      };
      
      const response = await axios.put(`/api/medicaments/${recordToEdit._id}`, recordData);
      
      if (response.data && response.data.success) {
        // Reîncărcăm lista pentru a obține datele actualizate și relațiile populate
        fetchMedicaments();
        
        setShowEditModal(false);
        setRecordToEdit(null);
        
        // Resetăm formularul
        setFormData({
          date: new Date().toISOString().split('T')[0],
          vehicle: '',
          notes: '',
          cityId: '',
          status: 'pending'
        });
        
        alert('Înregistrarea a fost actualizată cu succes!');
      } else {
        alert('Eroare la actualizarea înregistrării. Verificați datele și reîncercați.');
      }
    } catch (err) {
      console.error('Eroare la actualizarea înregistrării:', err);
      alert(`Eroare: ${err.response?.data?.message || 'Nu s-a putut actualiza înregistrarea'}`);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.vehicle) {
        alert('Vă rugăm să selectați o ambulanță!');
        return;
      }
      
      if (!formData.cityId) {
        alert('Vă rugăm să selectați un oraș!');
        return;
      }
      
      if (!formData.notes.trim()) {
        alert('Vă rugăm să adăugați detalii despre medicamente!');
        return;
      }
      
      const recordData = {
        date: formData.date,
        vehicle: formData.vehicle,
        notes: formData.notes,
        city: formData.cityId,
        status: formData.status
      };
      
      const response = await axios.post('/api/medicaments', recordData);
      
      if (response.data && response.data.data) {
        // Reîncărcăm lista pentru a obține datele actualizate și relațiile populate
        fetchMedicaments();
        
        setShowAddModal(false);
        
        setFormData({
          date: new Date().toISOString().split('T')[0],
          vehicle: '',
          notes: '',
          cityId: '',
          status: 'pending'
        });
        
        alert('Înregistrarea a fost adăugată cu succes!');
      } else {
        alert('Eroare la adăugarea înregistrării. Verificați datele și reîncercați.');
      }
    } catch (err) {
      console.error('Eroare la adăugare:', err);
      alert(`Eroare: ${err.response?.data?.message || 'Nu s-a putut adăuga înregistrarea'}`);
    }
  };
  
  const renderFilters = () => (
    <div className="content-card mb-4">
      <div className="row g-3">
        <div className="col-md-3">
          <div className="form-group">
            <label className="form-label">
              <FontAwesomeIcon icon={faSearch} className="me-2" />
              Caută
            </label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Detalii medicamente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {isAdmin && (
          <div className="col-md-2">
            <div className="form-group">
              <label className="form-label">
                <FontAwesomeIcon icon={faCity} className="me-2" />
                Oraș
              </label>
              <select 
                className="form-select"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              >
                <option value="">Toate orașele</option>
                {cities.map(city => (
                  <option key={city._id} value={city.name}>{city.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        
        <div className="col-md-2">
          <div className="form-group">
            <label className="form-label">
              <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
              Data
            </label>
            <input 
              type="date" 
              className="form-control"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>
        
        <div className="col-md-2">
          <div className="form-group">
            <label className="form-label">
              <FontAwesomeIcon icon={faAmbulance} className="me-2" />
              Ambulanța
            </label>
            <select 
              className="form-select"
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
            >
              <option value="">Toate ambulanțele</option>
              {vehicles.map(vehicle => (
                <option key={vehicle._id} value={vehicle._id}>
                  {vehicle.plateNumber}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="col-md-2">
          <div className="form-group">
            <label className="form-label">
              <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
              Status
            </label>
            <select 
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Toate statusurile</option>
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="row mt-3">
        <div className="col-12 d-flex justify-content-between align-items-center">
          <div>
            <button 
              className="btn btn-sm btn-outline-secondary me-2"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <FontAwesomeIcon 
                icon={faSortAmountDown} 
                className={`me-1 ${sortOrder === 'desc' ? '' : 'fa-flip-vertical'}`} 
              />
              {sortOrder === 'asc' ? 'Descrescător' : 'Crescător'}
            </button>
            
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={() => {
                setSearchTerm('');
                setCityFilter('');
                setDateFilter('');
                setVehicleFilter('');
                setStatusFilter('');
                setSortBy('date');
                setSortOrder('desc');
              }}
            >
              <FontAwesomeIcon icon={faFilter} className="me-1" />
              Resetează filtre
            </button>
          </div>
          
          <div>
            <button 
              className="btn btn-primary me-2" 
              onClick={fetchMedicaments}
            >
              <FontAwesomeIcon icon={faSync} className="me-2" />
              Reîmprospătează
            </button>
            
            <button 
              className="btn btn-success"
              onClick={handleAddNewRecord}
            >
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Adaugă înregistrare
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderMedicamentsTable = () => (
    <div className="content-card">
      <h5 className="mb-4">
        <FontAwesomeIcon icon={faMedkit} className="me-2" />
        Evidență Medicamente ({filteredMedicaments.length})
      </h5>
      
      <div className="table-responsive">
        <table className="table table-hover booking-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Ambulanță</th>
              <th>Detalii medicamente</th>
              <th>Status</th>
              {isAdmin && <th>Asistent</th>}
              <th>Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {filteredMedicaments.map(record => (
              <tr key={record._id}>
                <td>
                  <div>
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-1 text-muted" />
                    {formatDate(record.date)}
                  </div>
                </td>
                <td>
                  <div>
                    <FontAwesomeIcon icon={faAmbulance} className="me-1 text-muted" />
                    {record.vehicle ? record.vehicle.plateNumber : 'N/A'}
                  </div>
                </td>
                <td>
                  <div className="text-truncate" style={{ maxWidth: '300px' }}>
                    {record.notes}
                  </div>
                </td>
                <td>
                  {getStatusBadge(record.status)}
                </td>
                {isAdmin && (
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="me-2 assistant-avatar">
                        <FontAwesomeIcon icon={faUserNurse} size="xs" />
                      </div>
                      <div>
                        {record.assistant ? record.assistant.name : 'N/A'}
                      </div>
                    </div>
                  </td>
                )}
                <td>
                  <div className="d-flex">
                    <button 
                      className="btn btn-sm btn-primary me-1"
                      onClick={() => handleViewRecord(record)}
                      title="Vezi detalii"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                    
                    {(isAdmin || record.assistant && record.assistant._id === user._id) && (
                      <>
                        <button 
                          className="btn btn-sm btn-warning me-1"
                          onClick={() => handleEditInit(record)}
                          title="Editează"
                        >
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteInit(record)}
                          title="Șterge"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredMedicaments.length === 0 && !loading && (
        <div className="text-center py-4">
          <p className="text-muted">Nu există înregistrări de medicamente.</p>
          <button 
            className="btn btn-success mt-3"
            onClick={handleAddNewRecord}
          >
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Adaugă prima înregistrare
          </button>
        </div>
      )}
    </div>
  );
  
  const renderAddRecordModal = () => (
    <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Adaugă Medicament
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loadingVehicles || loadingCities ? (
          <div className="text-center py-3">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2">Se încarcă datele necesare...</p>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                    Data *
                  </Form.Label>
                  <Form.Control 
                    type="date" 
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faBuilding} className="me-2" />
                    Oraș *
                  </Form.Label>
                  {cities.length > 0 ? (
                    <Form.Select
                      name="cityId"
                      value={formData.cityId}
                      onChange={handleInputChange}
                      required
                      disabled={!isAdmin && user.city}
                    >
                      <option value="">Selectați un oraș</option>
                      {cities.map(city => (
                        <option key={city._id} value={city._id}>
                          {city.name}
                        </option>
                      ))}
                    </Form.Select>
                  ) : (
                    <div className="alert alert-warning">
                      Nu s-au găsit orașe disponibile.
                    </div>
                  )}
                </Form.Group>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faAmbulance} className="me-2" />
                    Ambulanță *
                  </Form.Label>
                  {vehicles.length > 0 ? (
                    <Form.Select
                      name="vehicle"
                      value={formData.vehicle}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Selectați o ambulanță</option>
                      {vehicles.map(vehicle => (
                        <option key={vehicle._id} value={vehicle._id}>
                          {vehicle.plateNumber}
                        </option>
                      ))}
                    </Form.Select>
                  ) : (
                    <div className="alert alert-warning">
                      Nu s-au găsit ambulanțe disponibile.
                    </div>
                  )}
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                    Status
                  </Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
            
            <Form.Group className="mb-3">
              <Form.Label>
                <FontAwesomeIcon icon={faClipboardList} className="me-2" />
                Detalii Medicamente *
              </Form.Label>
              <Form.Control 
                as="textarea" 
                rows={5}
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                required
                placeholder="Introduceți detalii despre medicamentele utilizate sau necesare..."
              />
            </Form.Group>
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowAddModal(false)}>
          Anulează
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={loadingVehicles || loadingCities}
        >
          Salvează înregistrarea
        </Button>
      </Modal.Footer>
    </Modal>
  );
  
  const renderEditRecordModal = () => (
    <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faPen} className="me-2" />
          Editează Medicament
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loadingVehicles || loadingCities ? (
          <div className="text-center py-3">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2">Se încarcă datele necesare...</p>
          </div>
        ) : (
          <Form onSubmit={handleEditSubmit}>
            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                    Data *
                  </Form.Label>
                  <Form.Control 
                    type="date" 
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faBuilding} className="me-2" />
                    Oraș *
                  </Form.Label>
                  {cities.length > 0 ? (
                    <Form.Select
                      name="cityId"
                      value={formData.cityId}
                      onChange={handleInputChange}
                      required
                      disabled={!isAdmin && user.city}
                    >
                      <option value="">Selectați un oraș</option>
                      {cities.map(city => (
                        <option key={city._id} value={city._id}>
                          {city.name}
                        </option>
                      ))}
                    </Form.Select>
                  ) : (
                    <div className="alert alert-warning">
                      Nu s-au găsit orașe disponibile.
                    </div>
                  )}
                </Form.Group>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faAmbulance} className="me-2" />
                    Ambulanță *
                  </Form.Label>
                  {vehicles.length > 0 ? (
                    <Form.Select
                      name="vehicle"
                      value={formData.vehicle}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Selectați o ambulanță</option>
                      {vehicles.map(vehicle => (
                        <option key={vehicle._id} value={vehicle._id}>
                          {vehicle.plateNumber}
                        </option>
                      ))}
                    </Form.Select>
                  ) : (
                    <div className="alert alert-warning">
                      Nu s-au găsit ambulanțe disponibile.
                    </div>
                  )}
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                    Status
                  </Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
            
            <Form.Group className="mb-3">
              <Form.Label>
                <FontAwesomeIcon icon={faClipboardList} className="me-2" />
                Detalii Medicamente *
              </Form.Label>
              <Form.Control 
                as="textarea" 
                rows={5}
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                required
                placeholder="Introduceți detalii despre medicamentele utilizate sau necesare..."
              />
            </Form.Group>
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
          Anulează
        </Button>
        <Button 
          variant="primary" 
          onClick={handleEditSubmit}
          disabled={loadingVehicles || loadingCities}
        >
          Salvează modificările
        </Button>
      </Modal.Footer>
    </Modal>
  );
  
  const renderViewRecordModal = () => (
    <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Detalii Medicament</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {currentRecord && (
          <div className="record-details">
            <div className="mb-4">
              <h5 className="mb-3">Informații Generale</h5>
              <p>
                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                <strong>Data:</strong> {formatDate(currentRecord.date)}
              </p>
              <p>
                <FontAwesomeIcon icon={faAmbulance} className="me-2" />
                <strong>Ambulanță:</strong> {currentRecord.vehicle ? currentRecord.vehicle.plateNumber : 'N/A'}
              </p>
              <p>
                <FontAwesomeIcon icon={faCity} className="me-2" />
                <strong>Oraș:</strong> {currentRecord.city ? currentRecord.city.name : 'N/A'}
              </p>
              <p>
                <FontAwesomeIcon icon={faUserNurse} className="me-2" />
                <strong>Asistent:</strong> {currentRecord.assistant ? currentRecord.assistant.name : 'N/A'}
              </p>
              <p>
                <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                <strong>Status:</strong> {getStatusBadge(currentRecord.status)}
              </p>
            </div>
            
            <div className="mb-4">
              <h5 className="mb-3">Detalii Medicamente</h5>
              <div className="p-3 bg-light rounded">
                <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{currentRecord.notes}</p>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowViewModal(false)}>
          Închide
        </Button>
        {(isAdmin || (currentRecord && currentRecord.assistant && currentRecord.assistant._id === user._id)) && (
          <Button 
            variant="warning"
            onClick={() => {
              setShowViewModal(false);
              handleEditInit(currentRecord);
            }}
          >
            <FontAwesomeIcon icon={faPen} className="me-1" />
            Editează
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
  
  const renderDeleteConfirmModal = () => (
    <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Confirmare ștergere</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {recordToDelete && (
          <p>
            Sunteți sigur că doriți să ștergeți înregistrarea din data <strong>{formatDate(recordToDelete.date)}</strong> pentru ambulanța <strong>{recordToDelete.vehicle ? recordToDelete.vehicle.plateNumber : 'N/A'}</strong>?
          </p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
          Anulează
        </Button>
        <Button variant="danger" onClick={handleDeleteConfirm}>
          <FontAwesomeIcon icon={faTrash} className="me-1" />
          Șterge înregistrarea
        </Button>
      </Modal.Footer>
    </Modal>
  );
  
  // Adăugăm stilizare CSS
  const customStyles = `
    .assistant-avatar {
      width: 24px;
      height: 24px;
      background-color: #e9ecef;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `;
  
  return (
    <Layout>
      <style>{customStyles}</style>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>
            <FontAwesomeIcon icon={faMedkit} className="me-2" />
            Evidență Medicamente
          </h1>
        </div>
        
        {renderFilters()}
        
        {loading ? (
          <div className="content-card">
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2">Se încarcă datele...</p>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          renderMedicamentsTable()
        )}
        
        {renderAddRecordModal()}
        {renderViewRecordModal()}
        {renderEditRecordModal()}
        {renderDeleteConfirmModal()}
      </div>
    </Layout>
  );
};

export default Medicaments;