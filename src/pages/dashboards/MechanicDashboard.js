import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StatsCard from '../../components/common/StatsCard';
import MaintenanceItem from '../../components/dashboard/MaintenanceItem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faClock,
  faCheckCircle,
  faAmbulance,
  faTools,
  faSpinner,
  faCalendarAlt,
  faCamera,
  faPlus,
  faSearch,
  faTachometerAlt,
  faSync
} from '@fortawesome/free-solid-svg-icons';

const MechanicDashboard = () => {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const isMechanic = user?.role === 'mechanic';

  const [serviceRecords, setServiceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [serviceStats, setServiceStats] = useState({
    pending: 0,
    'in-progress': 0,
    completed: 0,
    cancelled: 0,
    critical: 0,
    total: 0
  });
  const [formData, setFormData] = useState({
    vehicle: '',
    title: '',
    description: '',
    km: '',
    status: 'pending',
    partsReplaced: '',
    partsCost: 0,
    nextServiceKm: '',
    notes: ''
  });

  // modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [completeData, setCompleteData] = useState({
    partsReplaced: '',
    partsCost: ''
  });
  const [problemFile, setProblemFile] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);

  useEffect(() => {
    if (user) {
      fetchVehicles();
      fetchServiceStats();
      fetchRecentServiceRecords();
    }
  }, [user]);

  const fetchVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const res = await axios.get('/api/vehicles');
      const all = res.data.data || [];
      const processed = all.map(v => ({
        _id: v._id,
        plateNumber: v.plateNumber,
        model: v.model || 'N/A',
        type: v.type || 'N/A',
        city: typeof v.city === 'object' ? v.city.name : 'Necunoscut',
        cityId: typeof v.city === 'object' ? v.city._id : v.city
      }));
      const userCityId = typeof user.city === 'object' ? user.city._id : user.city;
      setVehicles(isAdmin ? processed : processed.filter(v => v.cityId === userCityId));
    } catch (err) {
      console.error('Eroare la încărcarea vehiculelor:', err);
      setVehicles([]);
    }
    setLoadingVehicles(false);
  };

  const fetchServiceStats = async () => {
    try {
      const res = await axios.get('/api/ambulance-service/stats');
      setServiceStats(res.data.data);
    } catch (err) {
      console.error('Eroare la încărcarea statisticilor:', err);
    }
  };

  const fetchRecentServiceRecords = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/ambulance-service?limit=5&sort=-date');
      const recs = res.data.data || [];
      setServiceRecords(
        recs.map(r => ({
          id: r._id,
          title: r.title,
          vehicle: r.vehicle?.plateNumber || 'N/A',
          location: r.city?.name || 'Necunoscut',
          km: r.km,
          status: r.status,
          statusText: getStatusText(r.status),
          description: r.description,
          image: r.problemImage
            ? `/uploads/${r.problemImage.replace(/^uploads\//, '')}`
            : '/api/placeholder/400/200',
          date: new Date(r.date).toISOString().split('T')[0]
        }))
      );
    } catch (err) {
      console.error('Eroare la încărcarea înregistrărilor:', err);
      setServiceRecords([]);
    }
    setLoading(false);
  };

  const getStatusText = status => {
    switch (status) {
      case 'pending':
        return 'În așteptare';
      case 'in-progress':
        return 'În lucru';
      case 'completed':
        return 'Finalizat';
      case 'cancelled':
        return 'Anulat';
      case 'critical':
        return 'Critic';
      default:
        return 'Necunoscut';
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(fd => ({ ...fd, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const userCityId = typeof user.city === 'object' ? user.city._id : user.city;
      const payload = {
        ...formData,
        km: parseInt(formData.km, 10),
        partsCost: parseFloat(formData.partsCost) || 0,
        city: userCityId,
        assignedTo: isMechanic ? user._id : null
      };
      await axios.post('/api/ambulance-service', payload);
      setFormData({
        vehicle: '',
        title: '',
        description: '',
        km: '',
        status: 'pending',
        partsReplaced: '',
        partsCost: 0,
        nextServiceKm: '',
        notes: ''
      });
      fetchServiceStats();
      fetchRecentServiceRecords();
    } catch (err) {
      console.error('Eroare la adăugare:', err);
      alert(err.response?.data?.message || 'Nu s-a putut adăuga înregistrarea');
    }
  };

  const handleViewAllServiceRecords = () => {
    navigate('/mechanic/service');
  };

  const openCompleteModal = rec => {
    setSelectedRecord(rec);
    setCompleteData({
      partsReplaced: rec.partsReplaced || '',
      partsCost: rec.partsCost || ''
    });
    setProblemFile(null);
    setReceiptFile(null);
    setShowCompleteModal(true);
  };

  const closeCompleteModal = () => {
    setShowCompleteModal(false);
    setSelectedRecord(null);
  };

  const handleCompleteSubmit = async e => {
    e.preventDefault();
    try {
      await axios.put(`/api/ambulance-service/${selectedRecord.id}`, {
        status: 'completed',
        partsReplaced: completeData.partsReplaced,
        partsCost: parseFloat(completeData.partsCost) || 0
      });
      if (problemFile) {
        const form = new FormData();
        form.append('problem', problemFile);
        await axios.post(
          `/api/ambulance-service/${selectedRecord.id}/upload-problem-image`,
          form,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
      }
      if (receiptFile) {
        const form = new FormData();
        form.append('receipt', receiptFile);
        await axios.post(
          `/api/ambulance-service/${selectedRecord.id}/upload-receipt`,
          form,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
      }
      fetchServiceStats();
      fetchRecentServiceRecords();
      closeCompleteModal();
    } catch (err) {
      console.error('Eroare la finalizare:', err);
      alert(err.response?.data?.message || 'Nu s-a putut finaliza lucrarea');
    }
  };

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="mb-0">Dashboard Mecanic</h1>
          <p className="text-muted">Sistem de management al mentenanței Ambu-Life</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <StatsCard
            icon={faExclamationTriangle}
            value={serviceStats.critical.toString()}
            label="Probleme critice"
            footer={<span>Necesită intervenție imediată</span>}
            iconBgColor="var(--danger-color)"
          />
        </div>
        <div className="col-md-3">
          <StatsCard
            icon={faClock}
            value={(serviceStats.pending + serviceStats['in-progress']).toString()}
            label="Întrețineri în așteptare"
            footer={<span>Necesită atenție</span>}
            iconBgColor="var(--warning-color)"
          />
        </div>
        <div className="col-md-3">
          <StatsCard
            icon={faCheckCircle}
            value={serviceStats.completed.toString()}
            label="Lucrări finalizate"
            footer={<span>Total înregistrate</span>}
            iconBgColor="var(--success-color)"
          />
        </div>
        <div className="col-md-3">
          <StatsCard
            icon={faAmbulance}
            value={vehicles.length.toString()}
            label="Vehicule active"
            footer={<span>În flotă</span>}
            iconBgColor="var(--secondary-color)"
          />
        </div>
      </div>

      {/* Add New Maintenance Record */}
      <div className="content-card mb-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0">
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Înregistrează o lucrare de mentenanță
          </h5>
          <button className="btn btn-primary" onClick={handleViewAllServiceRecords}>
            <FontAwesomeIcon icon={faSearch} className="me-2" />
            Vezi toate înregistrările
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">
                <FontAwesomeIcon icon={faAmbulance} className="me-2" />
                Ambulanță *
              </label>
              {vehicles.length > 0 ? (
                <select
                  className="form-select"
                  name="vehicle"
                  value={formData.vehicle}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Selectează ambulanța</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle._id} value={vehicle._id}>
                      {vehicle.plateNumber} - {vehicle.model} ({vehicle.city})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="alert alert-warning">
                  <small>Nu s-au găsit ambulanțe disponibile.</small>
                </div>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label">
                <FontAwesomeIcon icon={faTools} className="me-2" />
                Titlu lucrare / problemă *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Schimb ulei, Înlocuire plăcuțe frână, etc."
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">
                <FontAwesomeIcon icon={faTachometerAlt} className="me-2" />
                Kilometraj curent *
              </label>
              <input
                type="number"
                className="form-control"
                placeholder="Ex: 125000"
                name="km"
                value={formData.km}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">
                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                Data lucrării
              </label>
              <input
                type="date"
                className="form-control"
                name="date"
                value={new Date().toISOString().split('T')[0]}
                readOnly
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">
                <FontAwesomeIcon icon={faSpinner} className="me-2" />
                Status
              </label>
              <select
                className="form-select"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="pending">În așteptare</option>
                <option value="in-progress">În lucru</option>
                <option value="completed">Finalizat</option>
                <option value="critical">Critic</option>
              </select>
            </div>
          </div>

          <div className="camera-placeholder mb-3">
            <div className="camera-icon">
              <FontAwesomeIcon icon={faCamera} size="2x" />
            </div>
            <div className="camera-text">Imaginile pot fi adăugate după salvarea înregistrării</div>
          </div>

          <div className="mb-3">
            <label className="form-label">Descriere detaliată a lucrării *</label>
            <textarea
              className="form-control"
              rows="5"
              placeholder="Descrieți detaliat problema identificată și/sau lucrările efectuate..."
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Piese înlocuite</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Filtru ulei, Ulei motor, etc."
                name="partsReplaced"
                value={formData.partsReplaced}
                onChange={handleInputChange}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Cost piese (Lei)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Ex: 450"
                name="partsCost"
                value={formData.partsCost}
                onChange={handleInputChange}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Următoarea verificare (km)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Ex: 135000"
                name="nextServiceKm"
                value={formData.nextServiceKm}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="text-end">
            <button
              type="button"
              className="btn btn-secondary me-2"
              onClick={() =>
                setFormData({
                  vehicle: '',
                  title: '',
                  description: '',
                  km: '',
                  status: 'pending',
                  partsReplaced: '',
                  partsCost: 0,
                  nextServiceKm: '',
                  notes: ''
                })
              }
            >
              Anulează
            </button>
            <button type="submit" className="btn btn-primary">
              Salvează lucrare
            </button>
          </div>
        </form>
      </div>

      {/* Probleme recente */}
      <div className="content-card mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">
            <FontAwesomeIcon icon={faTools} className="me-2" />
            Probleme recente
          </h5>
          <button
            className="btn btn-outline-primary"
            onClick={() => {
              fetchRecentServiceRecords();
              fetchServiceStats();
            }}
          >
            <FontAwesomeIcon icon={faSync} className="me-2" />
            Refresh
          </button>
        </div>
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-2">Se încarcă înregistrările...</p>
          </div>
        ) : serviceRecords.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted">Nu există înregistrări de service.</p>
          </div>
        ) : (
          serviceRecords.map(record => (
            <div key={record.id} className="mb-3 position-relative">
              <MaintenanceItem maintenance={record} />
              {record.status !== 'completed' && (
                <button
                  className="btn btn-success position-absolute"
                  style={{ top: 16, right: 16 }}
                  onClick={() => openCompleteModal(record)}
                >
                  Finalizează
                </button>
              )}
            </div>
          ))
        )}
        <div className="text-center mt-4">
          <button className="btn btn-outline-secondary" onClick={handleViewAllServiceRecords}>
            Vezi toate lucrările
          </button>
        </div>
      </div>

      {/* Modal Finalizare */}
      {showCompleteModal && <div className="modal-backdrop show" />}
      {showCompleteModal && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog">
            <form className="modal-content" onSubmit={handleCompleteSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">Finalizează lucrarea</h5>
                <button type="button" className="btn-close" onClick={closeCompleteModal} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Piese înlocuite</label>
                  <input
                    type="text"
                    className="form-control"
                    value={completeData.partsReplaced}
                    onChange={e =>
                      setCompleteData(prev => ({ ...prev, partsReplaced: e.target.value }))
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Cost piese (Lei)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={completeData.partsCost}
                    onChange={e =>
                      setCompleteData(prev => ({ ...prev, partsCost: e.target.value }))
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Imagine problemă (opțional)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={e => setProblemFile(e.target.files[0])}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Imagine bon/factură (opțional)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={e => setReceiptFile(e.target.files[0])}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeCompleteModal}>
                  Anulează
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvează finalizarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* styled-jsx pentru modal în dark mode */}
      <style jsx>{`
        .modal-backdrop.show {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(18, 18, 18, 0.8);
          z-index: 1040;
        }
        .modal.d-block {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1050;
          outline: none;
        }
        .modal-content {
          background-color: var(--bg-card);
          color: var(--text-light);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.5);
        }
        .modal-header,
        .modal-footer {
          border-color: var(--border-color);
          background-color: var(--bg-card-secondary);
          color: var(--text-light);
        }
        .btn-close {
          filter: invert(1) brightness(1.2);
        }
        .modal-body {
          background-color: var(--bg-card);
          color: var(--text-light);
        }
        .modal-footer .btn-secondary {
          background-color: var(--bg-card-secondary);
          border-color: var(--border-color);
          color: var(--text-light);
        }
        .modal-footer .btn-primary {
          background-color: var(--secondary-color);
          border-color: var(--secondary-color);
          color: #fff;
        }
        .modal-footer .btn-primary:hover {
          background-color: var(--primary-color);
          border-color: var(--primary-color);
        }
      `}</style>
    </div>
  );
};

export default MechanicDashboard;


