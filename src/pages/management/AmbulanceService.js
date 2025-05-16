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
  faTools,
  faWrench,
  faUserNurse,
  faBuilding,
  faFileUpload,
  faFilePdf,
  faFileImage,
  faFile,
  faDownload,
  faCamera,
  faPaperclip,
  faInfoCircle,
  faCar,
  faAmbulance,
  faTachometerAlt,
  faDollarSign,
  faExclamationTriangle,
  faExclamationCircle,
  faRoadCircleExclamation,
  faComments,
  faUserCog,
  faUserMd,
  faReceipt
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import { Modal, Button, Form, Badge, ProgressBar } from 'react-bootstrap';

const AmbulanceService = () => {
  const { user } = useSelector(state => state.auth);
  const isAdmin = user && user.role === 'admin';
  const isMechanic = user && user.role === 'mechanic';
  
  const [serviceRecords, setServiceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [mechanics, setMechanics] = useState([]);
  const [loadingMechanics, setLoadingMechanics] = useState(false);
  const [serviceStats, setServiceStats] = useState({
    pending: 0,
    'in-progress': 0,
    completed: 0,
    cancelled: 0,
    critical: 0,
    total: 0
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [mechanicFilter, setMechanicFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [recordToAssign, setRecordToAssign] = useState(null);
  
  // State pentru încărcarea documentelor
  const [selectedProblemFile, setSelectedProblemFile] = useState(null);
  const [selectedReceiptFile, setSelectedReceiptFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [activeImageType, setActiveImageType] = useState(null);
  
  const [formData, setFormData] = useState({
    vehicle: '',
    title: '',
    description: '',
    km: '',
    status: 'pending',
    partsReplaced: '',
    partsCost: 0,
    nextServiceKm: '',
    notes: '',
    cityId: '',
    assignedTo: ''
  });

  const serviceStatusTypes = [
    { value: 'pending', label: 'În așteptare', icon: faClock, color: 'warning' },
    { value: 'in-progress', label: 'În lucru', icon: faSpinner, color: 'info' },
    { value: 'completed', label: 'Finalizat', icon: faCheckCircle, color: 'success' },
    { value: 'cancelled', label: 'Anulat', icon: faTrash, color: 'secondary' },
    { value: 'critical', label: 'Critic', icon: faExclamationTriangle, color: 'danger' }
  ];
  
  useEffect(() => {
    if (user) {
      fetchVehicles();
      fetchCities();
      fetchMechanics();
      fetchServiceStats();
    }
  }, [user]);
  
  useEffect(() => {
    if (user && vehicles.length > 0) {
      fetchServiceRecords();
    }
  }, [user, vehicles]);
  
  const fetchServiceRecords = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/ambulance-service');
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        const recordsData = await Promise.all(response.data.data.map(async record => {
          // Formatăm data
          const recordDate = new Date(record.date);
          const formattedDate = recordDate.toISOString().split('T')[0];
          
          // Extragem numele și ID-ul orașului
          let cityName = 'Necunoscut';
          let cityId = null;
          
          if (record.city) {
            if (typeof record.city === 'object') {
              cityName = record.city.name || 'Necunoscut';
              cityId = record.city._id;
            } else if (typeof record.city === 'string') {
              cityId = record.city;
              const foundCity = cities.find(c => c._id === cityId);
              if (foundCity) {
                cityName = foundCity.name;
              }
            }
          }
          
          // Extragem informații despre vehicul
          let vehiclePlateNumber = 'N/A';
          let vehicleModel = 'N/A';
          let vehicleType = 'N/A';
          let vehicleId = null;
          
          if (record.vehicle) {
            if (typeof record.vehicle === 'object') {
              vehiclePlateNumber = record.vehicle.plateNumber || 'N/A';
              vehicleModel = record.vehicle.model || 'N/A';
              vehicleType = record.vehicle.type || 'N/A';
              vehicleId = record.vehicle._id;
            } else if (typeof record.vehicle === 'string') {
              vehicleId = record.vehicle;
              const foundVehicle = vehicles.find(v => v._id === vehicleId);
              if (foundVehicle) {
                vehiclePlateNumber = foundVehicle.plateNumber;
                vehicleModel = foundVehicle.model || 'N/A';
                vehicleType = foundVehicle.type || 'N/A';
              }
            }
          }
          
          // Extragem numele reporter-ului
          let reporterName = 'Necunoscut';
          let reporterId = null;
          
          if (record.reporter) {
            if (typeof record.reporter === 'object') {
              reporterName = record.reporter.name || 'Necunoscut';
              reporterId = record.reporter._id;
            } else if (typeof record.reporter === 'string') {
              reporterId = record.reporter;
              
              if (reporterId === user._id) {
                reporterName = user.name;
              } else {
                try {
                  const userResponse = await axios.get(`/api/users/${reporterId}`);
                  if (userResponse.data && userResponse.data.data) {
                    reporterName = userResponse.data.data.name || 'Necunoscut';
                  }
                } catch (error) {
                  console.error(`Nu s-a putut obține reporter-ul cu ID ${reporterId}:`, error);
                }
              }
            }
          }
          
          // Extragem numele mecanicului
          let mechanicName = 'Nealocat';
          let mechanicId = null;
          
          if (record.assignedTo) {
            if (typeof record.assignedTo === 'object') {
              mechanicName = record.assignedTo.name || 'Nealocat';
              mechanicId = record.assignedTo._id;
            } else if (typeof record.assignedTo === 'string') {
              mechanicId = record.assignedTo;
              
              if (mechanicId === user._id) {
                mechanicName = user.name;
              } else {
                const foundMechanic = mechanics.find(m => m._id === mechanicId);
                if (foundMechanic) {
                  mechanicName = foundMechanic.name;
                } else {
                  try {
                    const userResponse = await axios.get(`/api/users/${mechanicId}`);
                    if (userResponse.data && userResponse.data.data) {
                      mechanicName = userResponse.data.data.name || 'Mecanic';
                    }
                  } catch (error) {
                    console.error(`Nu s-a putut obține mecanicul cu ID ${mechanicId}:`, error);
                  }
                }
              }
            }
          }
          
          // Formatăm data finalizării dacă există
          let completionDate = null;
          if (record.completionDate) {
            const date = new Date(record.completionDate);
            completionDate = date.toISOString().split('T')[0];
          }

          return {
            _id: record._id,
            date: formattedDate,
            title: record.title,
            description: record.description,
            km: record.km,
            status: record.status,
            vehiclePlateNumber,
            vehicleModel,
            vehicleType,
            vehicleId,
            city: cityName,
            cityId,
            reporterName,
            reporterId,
            mechanicName,
            mechanicId,
            partsReplaced: record.partsReplaced || '',
            partsCost: record.partsCost || 0,
            nextServiceKm: record.nextServiceKm || '',
            notes: record.notes || '',
            problemImage: record.problemImage,
            receiptImage: record.receiptImage,
            completionDate,
          };
        }));
        
        const userCityId = user.city && typeof user.city === 'object' 
          ? user.city._id 
          : typeof user.city === 'string' 
            ? user.city 
            : null;
            
        let filteredRecords = recordsData;
        
        // Filtrare în funcție de rol
        if (!isAdmin && !isMechanic) {
          // Dacă e un utilizator normal, vede doar înregistrările din orașul lui
          filteredRecords = recordsData.filter(record => record.cityId === userCityId);
        } else if (isMechanic && !isAdmin) {
          // Dacă e mecanic, vede toate înregistrările din orașul lui plus cele asignate lui
          filteredRecords = recordsData.filter(record => 
            record.cityId === userCityId || record.mechanicId === user._id
          );
        }
        
        setServiceRecords(filteredRecords);
      } else {
        console.warn('Nu s-au găsit înregistrări de service în răspunsul API-ului sau formatul datelor este incorect.');
        setServiceRecords([]);
      }
      
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Eroare la încărcarea înregistrărilor de service:', err);
      setError(err.response?.data?.message || 'Nu s-au putut obține înregistrările. Vă rugăm să reîncercați mai târziu.');
      setLoading(false);
      setServiceRecords([]);
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
        
        const processedVehicles = allVehicles.map(vehicle => {
          // Verificăm dacă avem un oraș valid
          let cityName = 'Necunoscut';
          let cityId = null;
          
          if (vehicle.city) {
            if (typeof vehicle.city === 'object' && vehicle.city.name) {
              // Cazul când obiectul city este populat complet
              cityName = vehicle.city.name;
              cityId = vehicle.city._id;
            } else if (typeof vehicle.city === 'string') {
              // Cazul când avem doar ID-ul orașului
              cityId = vehicle.city;
              
              // Avem un ID de oraș, încercăm să găsim numele
              // Folosim ID-uri hardcodate pentru a rezolva problema temporar
              if (cityId === '6823053af3c9fed99da59f39') {
                cityName = 'Suceava';
              } else if (cityId === '6823053af3c9fed99da59f3a') {
                cityName = 'Botoșani';
              }
            }
          }
          
          return {
            _id: vehicle._id,
            plateNumber: vehicle.plateNumber,
            model: vehicle.model || 'N/A',
            type: vehicle.type || 'N/A',
            city: cityName,  // Folosim numele orașului procesat
            cityId: cityId
          };
        });
        
        const userCityId = user.city && typeof user.city === 'object' 
          ? user.city._id 
          : typeof user.city === 'string' 
            ? user.city 
            : null;
        
        const filteredVehicles = isAdmin 
          ? processedVehicles 
          : processedVehicles.filter(vehicle => vehicle.cityId === userCityId);
        
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

  const fetchMechanics = async () => {
    setLoadingMechanics(true);
    try {
      // Folosește noua rută API special pentru mecanici
      const response = await axios.get('/api/users/mechanics');
      
      if (response.data && response.data.data) {
        const mechanics = response.data.data;
        
        // Procesează datele pentru afișare
        const processedMechanics = mechanics.map(mechanic => ({
          _id: mechanic._id,
          name: mechanic.name || 'Mecanic necunoscut',
          city: mechanic.city && mechanic.city.name ? mechanic.city.name : 'Oraș necunoscut',
          cityId: mechanic.city && mechanic.city._id ? mechanic.city._id : null
        }));
        
        setMechanics(processedMechanics);
        console.log('Mecanici încărcați:', processedMechanics);
      } else {
        setMechanics([]);
      }
      
      setLoadingMechanics(false);
    } catch (err) {
      console.error('Eroare la încărcarea mecanicilor:', err);
      setMechanics([]);
      setLoadingMechanics(false);
    }
  };
  
  const fetchServiceStats = async () => {
    try {
      const response = await axios.get('/api/ambulance-service/stats');
      
      if (response.data && response.data.data) {
        setServiceStats(response.data.data);
      }
    } catch (err) {
      console.error('Eroare la încărcarea statisticilor de service:', err);
    }
  };
  
  const filteredRecords = serviceRecords.filter(record => {
    const matchesSearch = 
      searchTerm === '' || 
      (record.vehiclePlateNumber && record.vehiclePlateNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.title && record.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.description && record.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCity = cityFilter === '' || record.city === cityFilter;
    
    const matchesDate = dateFilter === '' || 
      record.date === dateFilter;
    
    const matchesStatus = statusFilter === '' || record.status === statusFilter;
    
    const matchesVehicle = vehicleFilter === '' || record.vehicleId === vehicleFilter;
    
    const matchesMechanic = mechanicFilter === '' || record.mechanicId === mechanicFilter;
    
    return matchesSearch && matchesCity && matchesDate && matchesStatus && matchesVehicle && matchesMechanic;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'asc' 
        ? dateA - dateB 
        : dateB - dateA;
    } else if (sortBy === 'km') {
      return sortOrder === 'asc'
        ? a.km - b.km
        : b.km - a.km;
    } else if (sortBy === 'vehicle') {
      return sortOrder === 'asc'
        ? a.vehiclePlateNumber.localeCompare(b.vehiclePlateNumber)
        : b.vehiclePlateNumber.localeCompare(a.vehiclePlateNumber);
    } else if (sortBy === 'status') {
      return sortOrder === 'asc'
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    }
    return 0;
  });
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  const getFileIcon = (mimetype) => {
    if (!mimetype) return faFile;
    if (mimetype.includes('pdf')) return faFilePdf;
    if (mimetype.includes('image')) return faFileImage;
    return faFile;
  };
  
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const handleFileChange = (e, type) => {
    if (type === 'problem') {
      setSelectedProblemFile(e.target.files[0]);
    } else if (type === 'receipt') {
      setSelectedReceiptFile(e.target.files[0]);
    }
  };
  
  const handleUploadImage = async (recordId, type) => {
    setActiveImageType(type);
    const file = type === 'problem' ? selectedProblemFile : selectedReceiptFile;
    
    if (!file) {
      alert(`Vă rugăm să selectați un fișier pentru ${type === 'problem' ? 'imaginea problemei' : 'bonul fiscal'}`);
      return;
    }
    
    const formData = new FormData();
    formData.append(type, file);
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const response = await axios.post(
        `/api/ambulance-service/${recordId}/upload-${type}-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );
      
      if (response.data && response.data.success) {
        if (type === 'problem') {
          setSelectedProblemFile(null);
        } else {
          setSelectedReceiptFile(null);
        }
        
        alert(`${type === 'problem' ? 'Imaginea problemei' : 'Bonul fiscal'} a fost încărcat cu succes!`);
        
        // Reîncarcă înregistrarea pentru a obține imaginea actualizată
        try {
          const recordResponse = await axios.get(`/api/ambulance-service/${recordId}`);
          
          if (recordResponse.data && recordResponse.data.success) {
            const updatedRecord = recordResponse.data.data;
            
            // Actualizăm înregistrarea curentă dacă este cea care se afișează
            if (currentRecord && currentRecord._id === recordId) {
              setCurrentRecord({
                ...currentRecord,
                problemImage: type === 'problem' ? updatedRecord.problemImage : currentRecord.problemImage,
                receiptImage: type === 'receipt' ? updatedRecord.receiptImage : currentRecord.receiptImage
              });
            }
            
            // Actualizăm și lista generală
            setServiceRecords(prevRecords => 
              prevRecords.map(r => 
                r._id === recordId ? {
                  ...r,
                  problemImage: type === 'problem' ? updatedRecord.problemImage : r.problemImage,
                  receiptImage: type === 'receipt' ? updatedRecord.receiptImage : r.receiptImage
                } : r
              )
            );
          }
        } catch (fetchErr) {
          console.error(`Eroare la reîncărcarea înregistrării după încărcare ${type}:`, fetchErr);
        }
      }
    } catch (err) {
      console.error(`Eroare la încărcarea ${type === 'problem' ? 'imaginii problemei' : 'bonului fiscal'}:`, err);
      alert(`Eroare: ${err.response?.data?.message || `Nu s-a putut încărca ${type === 'problem' ? 'imaginea problemei' : 'bonul fiscal'}`}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setActiveImageType(null);
    }
  };
  
  const handleDownloadImage = async (recordId, type) => {
    try {
      const response = await axios.get(`/api/ambulance-service/${recordId}/${type}-image/download`, {
        responseType: 'blob'
      });
      
      // Creăm un URL pentru blob și descărcăm fișierul
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type === 'problem' ? 'problema' : 'bon'}_${recordId}.jpg`);
      document.body.appendChild(link);
      link.click();
      
      // Curat elementul și eliberez URL-ul
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error(`Eroare la descărcarea ${type === 'problem' ? 'imaginii problemei' : 'bonului fiscal'}:`, err);
      alert(`Eroare: ${err.response?.data?.message || `Nu s-a putut descărca ${type === 'problem' ? 'imaginea problemei' : 'bonul fiscal'}`}`);
    }
  };
  
  const handleViewRecord = (record) => {
    setCurrentRecord(record);
    setShowViewModal(true);
  };
  
  const handleAddNewRecord = () => {
    const initialFormData = {
      vehicle: '',
      title: '',
      description: '',
      km: '',
      status: 'pending',
      partsReplaced: '',
      partsCost: 0,
      nextServiceKm: '',
      notes: '',
      cityId: '',
      assignedTo: ''
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
      vehicle: record.vehicleId || '',
      title: record.title || '',
      description: record.description || '',
      km: record.km || '',
      status: record.status || 'pending',
      partsReplaced: record.partsReplaced || '',
      partsCost: record.partsCost || 0,
      nextServiceKm: record.nextServiceKm || '',
      notes: record.notes || '',
      cityId: record.cityId || '',
      assignedTo: record.mechanicId || ''
    });
    
    setRecordToEdit(record);
    setShowEditModal(true);
  };

  const handleAssignInit = (record) => {
    setRecordToAssign(record);
    setFormData({
      ...formData,
      assignedTo: record.mechanicId || ''
    });
    setShowAssignModal(true);
  };
  
  const handleDeleteInit = (record) => {
    setRecordToDelete(record);
    setShowDeleteConfirm(true);
  };
  
  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/ambulance-service/${recordToDelete._id}`);
      
      setServiceRecords(serviceRecords.filter(r => r._id !== recordToDelete._id));
      
      setShowDeleteConfirm(false);
      setRecordToDelete(null);
      
      alert('Înregistrarea a fost ștearsă cu succes');
      
      // Reîncărcăm statisticile
      fetchServiceStats();
    } catch (err) {
      console.error('Eroare la ștergere:', err);
      alert(`Eroare: ${err.response?.data?.message || 'Nu s-a putut șterge înregistrarea'}`);
      setShowDeleteConfirm(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.assignedTo) {
        alert('Vă rugăm să selectați un mecanic!');
        return;
      }
      
      const response = await axios.put(`/api/ambulance-service/${recordToAssign._id}/assign/${formData.assignedTo}`);
      
      if (response.data && response.data.success) {
        const selectedMechanic = mechanics.find(mechanic => mechanic._id === formData.assignedTo);
        const mechanicName = selectedMechanic ? selectedMechanic.name : 'Mecanic necunoscut';
        
        // Actualizăm lista de service
        setServiceRecords(prevRecords => 
          prevRecords.map(r => 
            r._id === recordToAssign._id ? {
              ...r,
              mechanicId: formData.assignedTo,
              mechanicName: mechanicName,
              status: r.status === 'pending' ? 'in-progress' : r.status
            } : r
          )
        );
        
        setShowAssignModal(false);
        setRecordToAssign(null);
        
        alert('Mecanicul a fost asignat cu succes!');
        
        // Reîncărcăm statisticile
        fetchServiceStats();
      } else {
        alert('Eroare la asignarea mecanicului. Încercați din nou.');
      }
    } catch (err) {
      console.error('Eroare la asignarea mecanicului:', err);
      alert(`Eroare: ${err.response?.data?.message || 'Nu s-a putut asigna mecanicul'}`);
    }
  };
  
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.cityId) {
        alert('Vă rugăm să selectați un oraș!');
        return;
      }
      
      if (!formData.vehicle) {
        alert('Vă rugăm să selectați o ambulanță!');
        return;
      }
      
      const recordData = {
        vehicle: formData.vehicle,
        title: formData.title,
        description: formData.description,
        km: parseInt(formData.km),
        status: formData.status,
        partsReplaced: formData.partsReplaced,
        partsCost: parseFloat(formData.partsCost) || 0,
        nextServiceKm: formData.nextServiceKm ? parseInt(formData.nextServiceKm) : null,
        notes: formData.notes,
        city: formData.cityId,
        assignedTo: formData.assignedTo || null
      };
      
      const response = await axios.put(`/api/ambulance-service/${recordToEdit._id}`, recordData);
     
     if (response.data && response.data.success) {
       const selectedCity = cities.find(city => city._id === formData.cityId);
       const cityName = selectedCity ? selectedCity.name : 'Necunoscut';
       
       const selectedVehicle = vehicles.find(v => v._id === formData.vehicle);
       let vehiclePlateNumber = 'N/A';
       let vehicleModel = 'N/A';
       let vehicleType = 'N/A';
       
       if (selectedVehicle) {
         vehiclePlateNumber = selectedVehicle.plateNumber;
         vehicleModel = selectedVehicle.model || 'N/A';
         vehicleType = selectedVehicle.type || 'N/A';
       }
       
       let mechanicName = 'Nealocat';
       if (formData.assignedTo) {
         const selectedMechanic = mechanics.find(m => m._id === formData.assignedTo);
         if (selectedMechanic) {
           mechanicName = selectedMechanic.name;
         }
       }
       
       const updatedRecord = {
         ...recordToEdit,
         title: formData.title,
         description: formData.description,
         km: parseInt(formData.km),
         status: formData.status,
         vehiclePlateNumber,
         vehicleModel,
         vehicleType,
         vehicleId: formData.vehicle,
         city: cityName,
         cityId: formData.cityId,
         mechanicName: formData.assignedTo ? mechanicName : 'Nealocat',
         mechanicId: formData.assignedTo || null,
         partsReplaced: formData.partsReplaced,
         partsCost: parseFloat(formData.partsCost) || 0,
         nextServiceKm: formData.nextServiceKm ? parseInt(formData.nextServiceKm) : null,
         notes: formData.notes
       };
       
       // Verificăm dacă statusul a fost schimbat în completed
       if (formData.status === 'completed' && recordToEdit.status !== 'completed') {
         updatedRecord.completionDate = new Date().toISOString().split('T')[0];
       }
       
       setServiceRecords(prevRecords => 
         prevRecords.map(r => 
           r._id === recordToEdit._id ? updatedRecord : r
         )
       );
       
       setShowEditModal(false);
       setRecordToEdit(null);
       
       // Resetăm formularul
       setFormData({
         vehicle: '',
         title: '',
         description: '',
         km: '',
         status: 'pending',
         partsReplaced: '',
         partsCost: 0,
         nextServiceKm: '',
         notes: '',
         cityId: '',
         assignedTo: ''
       });
       
       alert('Înregistrarea a fost actualizată cu succes!');
       
       // Reîncărcăm statisticile
       fetchServiceStats();
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
     if (!formData.cityId) {
       alert('Vă rugăm să selectați un oraș!');
       return;
     }
     
     if (!formData.vehicle) {
       alert('Vă rugăm să selectați o ambulanță!');
       return;
     }
     
     const recordData = {
       vehicle: formData.vehicle,
       title: formData.title,
       description: formData.description,
       km: parseInt(formData.km),
       status: formData.status,
       partsReplaced: formData.partsReplaced,
       partsCost: parseFloat(formData.partsCost) || 0,
       nextServiceKm: formData.nextServiceKm ? parseInt(formData.nextServiceKm) : null,
       notes: formData.notes,
       city: formData.cityId,
       assignedTo: formData.assignedTo || null
     };
     
     const response = await axios.post('/api/ambulance-service', recordData);
     
     if (response.data && response.data.data) {
       const createdRecord = response.data.data;
       
       // Încarcă imaginile după crearea înregistrării, dacă există fișiere selectate
       if (selectedProblemFile) {
         try {
           setIsUploading(true);
           setUploadProgress(0);
           setActiveImageType('problem');
           
           const problemFormData = new FormData();
           problemFormData.append('problem', selectedProblemFile);
           
           await axios.post(
             `/api/ambulance-service/${createdRecord._id}/upload-problem-image`,
             problemFormData,
             {
               headers: {
                 'Content-Type': 'multipart/form-data'
               },
               onUploadProgress: (progressEvent) => {
                 const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                 setUploadProgress(percentCompleted);
               }
             }
           );
         } catch (uploadErr) {
           console.error('Eroare la încărcarea imaginii problemei:', uploadErr);
           alert(`Înregistrarea a fost creată, dar a apărut o eroare la încărcarea imaginii problemei: ${uploadErr.response?.data?.message || 'Eroare la încărcare'}`);
         } finally {
           setIsUploading(false);
           setUploadProgress(0);
           setSelectedProblemFile(null);
           setActiveImageType(null);
         }
       }
       
       if (selectedReceiptFile) {
         try {
           setIsUploading(true);
           setUploadProgress(0);
           setActiveImageType('receipt');
           
           const receiptFormData = new FormData();
           receiptFormData.append('receipt', selectedReceiptFile);
           
           await axios.post(
             `/api/ambulance-service/${createdRecord._id}/upload-receipt`,
             receiptFormData,
             {
               headers: {
                 'Content-Type': 'multipart/form-data'
               },
               onUploadProgress: (progressEvent) => {
                 const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                 setUploadProgress(percentCompleted);
               }
             }
           );
         } catch (uploadErr) {
           console.error('Eroare la încărcarea bonului fiscal:', uploadErr);
           alert(`Înregistrarea a fost creată, dar a apărut o eroare la încărcarea bonului fiscal: ${uploadErr.response?.data?.message || 'Eroare la încărcare'}`);
         } finally {
           setIsUploading(false);
           setUploadProgress(0);
           setSelectedReceiptFile(null);
           setActiveImageType(null);
         }
       }
       
       const selectedCity = cities.find(city => city._id === formData.cityId);
       const cityName = selectedCity ? selectedCity.name : 'Necunoscut';
       
       const selectedVehicle = vehicles.find(v => v._id === formData.vehicle);
       let vehiclePlateNumber = 'N/A';
       let vehicleModel = 'N/A';
       let vehicleType = 'N/A';
       
       if (selectedVehicle) {
         vehiclePlateNumber = selectedVehicle.plateNumber;
         vehicleModel = selectedVehicle.model || 'N/A';
         vehicleType = selectedVehicle.type || 'N/A';
       }
       
       let mechanicName = 'Nealocat';
       if (formData.assignedTo) {
         const selectedMechanic = mechanics.find(m => m._id === formData.assignedTo);
         if (selectedMechanic) {
           mechanicName = selectedMechanic.name;
         }
       }
       
       const newRecord = {
         _id: createdRecord._id,
         date: new Date().toISOString().split('T')[0],
         title: formData.title,
         description: formData.description,
         km: parseInt(formData.km),
         status: formData.status,
         vehiclePlateNumber,
         vehicleModel,
         vehicleType,
         vehicleId: formData.vehicle,
         city: cityName,
         cityId: formData.cityId,
         reporterName: user.name,
         reporterId: user._id,
         mechanicName: formData.assignedTo ? mechanicName : 'Nealocat',
         mechanicId: formData.assignedTo || null,
         partsReplaced: formData.partsReplaced,
         partsCost: parseFloat(formData.partsCost) || 0,
         nextServiceKm: formData.nextServiceKm ? parseInt(formData.nextServiceKm) : null,
         notes: formData.notes,
         problemImage: null,
         receiptImage: null
       };
       
       setServiceRecords([newRecord, ...serviceRecords]);
       setShowAddModal(false);
       
       setFormData({
         vehicle: '',
         title: '',
         description: '',
         km: '',
         status: 'pending',
         partsReplaced: '',
         partsCost: 0,
         nextServiceKm: '',
         notes: '',
         cityId: '',
         assignedTo: ''
       });
       
       alert('Înregistrarea a fost adăugată cu succes!');
       
       // Reîncărcăm statisticile
       fetchServiceStats();
     } else {
       alert('Eroare la adăugarea înregistrării. Verificați datele și reîncercați.');
     }
   } catch (err) {
     console.error('Eroare la adăugare:', err);
     alert(`Eroare: ${err.response?.data?.message || 'Nu s-a putut adăuga înregistrarea'}`);
   }
 };
 
 const getStatusStyle = (status) => {
   const statusType = serviceStatusTypes.find(type => type.value === status);
   return statusType || { value: 'pending', label: 'În așteptare', icon: faClock, color: 'warning' };
 };
 
 const renderStats = () => (
   <div className="content-card mb-4">
     <h5 className="mb-3">
       <FontAwesomeIcon icon={faTools} className="me-2" />
       Statistici Service Ambulanțe
     </h5>
     <div className="row">
       <div className="col-md">
         <div className="card bg-warning text-white">
           <div className="card-body">
             <div className="d-flex justify-content-between align-items-center">
               <div>
                 <h6 className="mb-0">În așteptare</h6>
                 <h3 className="mt-2 mb-0">{serviceStats.pending}</h3>
               </div>
               <FontAwesomeIcon icon={faClock} size="2x" />
             </div>
           </div>
         </div>
       </div>
       <div className="col-md">
         <div className="card bg-info text-white">
           <div className="card-body">
             <div className="d-flex justify-content-between align-items-center">
               <div>
                 <h6 className="mb-0">În lucru</h6>
                 <h3 className="mt-2 mb-0">{serviceStats['in-progress']}</h3>
               </div>
               <FontAwesomeIcon icon={faSpinner} size="2x" />
             </div>
           </div>
         </div>
       </div>
       <div className="col-md">
         <div className="card bg-success text-white">
           <div className="card-body">
             <div className="d-flex justify-content-between align-items-center">
               <div>
                 <h6 className="mb-0">Finalizate</h6>
                 <h3 className="mt-2 mb-0">{serviceStats.completed}</h3>
               </div>
               <FontAwesomeIcon icon={faCheckCircle} size="2x" />
             </div>
           </div>
         </div>
       </div>
       <div className="col-md">
         <div className="card bg-danger text-white">
           <div className="card-body">
             <div className="d-flex justify-content-between align-items-center">
               <div>
                 <h6 className="mb-0">Critice</h6>
                 <h3 className="mt-2 mb-0">{serviceStats.critical}</h3>
               </div>
               <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
             </div>
           </div>
         </div>
       </div>
       <div className="col-md">
         <div className="card bg-primary text-white">
           <div className="card-body">
             <div className="d-flex justify-content-between align-items-center">
               <div>
                 <h6 className="mb-0">Total</h6>
                 <h3 className="mt-2 mb-0">{serviceStats.total}</h3>
               </div>
               <FontAwesomeIcon icon={faTools} size="2x" />
             </div>
           </div>
         </div>
       </div>
     </div>
   </div>
 );

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
             placeholder="Număr ambulanță, titlu, descriere..."
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
             <FontAwesomeIcon icon={faSpinner} className="me-2" />
             Status
           </label>
           <select 
             className="form-select"
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
           >
             <option value="">Toate statusurile</option>
             {serviceStatusTypes.map(status => (
               <option key={status.value} value={status.value}>{status.label}</option>
             ))}
           </select>
         </div>
       </div>

       <div className="col-md-2">
         <div className="form-group">
           <label className="form-label">
             <FontAwesomeIcon icon={faAmbulance} className="me-2" />
             Ambulanță
           </label>
           <select 
             className="form-select"
             value={vehicleFilter}
             onChange={(e) => setVehicleFilter(e.target.value)}
           >
             <option value="">Toate ambulanțele</option>
             {vehicles.map(vehicle => (
               <option key={vehicle._id} value={vehicle._id}>{vehicle.plateNumber}</option>
             ))}
           </select>
         </div>
       </div>
       
       {(isAdmin || isMechanic) && (
         <div className="col-md-2">
           <div className="form-group">
             <label className="form-label">
               <FontAwesomeIcon icon={faUserMd} className="me-2" />
               Mecanic
             </label>
             <select 
               className="form-select"
               value={mechanicFilter}
               onChange={(e) => setMechanicFilter(e.target.value)}
             >
               <option value="">Toți mecanicii</option>
               {mechanics.map(mechanic => (
                 <option key={mechanic._id} value={mechanic._id}>{mechanic.name}</option>
               ))}
             </select>
           </div>
         </div>
       )}
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
           
           <select
             className="btn btn-sm btn-outline-secondary me-2"
             value={sortBy}
             onChange={(e) => setSortBy(e.target.value)}
           >
             <option value="date">Sortează după dată</option>
             <option value="km">Sortează după kilometraj</option>
             <option value="vehicle">Sortează după ambulanță</option>
             <option value="status">Sortează după status</option>
           </select>
           
           <button 
             className="btn btn-sm btn-outline-secondary"
             onClick={() => {
               setSearchTerm('');
               setCityFilter('');
               setDateFilter('');
               setStatusFilter('');
               setVehicleFilter('');
               setMechanicFilter('');
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
             onClick={() => {
               fetchServiceRecords();
               fetchServiceStats();
             }}
           >
             <FontAwesomeIcon icon={faSync} className="me-2" />
             Reîmprospătează
           </button>
           
           <button 
             className="btn btn-success"
             onClick={handleAddNewRecord}
           >
             <FontAwesomeIcon icon={faPlus} className="me-2" />
             Adaugă înregistrare service
           </button>
         </div>
       </div>
     </div>
   </div>
 );
 
 const renderRecordsTable = () => (
   <div className="content-card">
     <h5 className="mb-4">
       <FontAwesomeIcon icon={faTools} className="me-2" />
       Înregistrări Service Ambulanțe ({filteredRecords.length})
     </h5>
     
     <div className="table-responsive">
       <table className="table table-hover booking-table">
         <thead>
           <tr>
             <th>Data</th>
             <th>Ambulanță</th>
             <th>Problema</th>
             <th>Kilometraj</th>
             <th>Status</th>
             {(isAdmin || isMechanic) && <th>Mecanic</th>}
             <th>Documente</th>
             <th>Acțiuni</th>
           </tr>
         </thead>
         <tbody>
           {filteredRecords.map(record => {
             const statusStyle = getStatusStyle(record.status);
             const hasProblemImage = !!record.problemImage;
             const hasReceiptImage = !!record.receiptImage;
             
             return (
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
                     {record.vehiclePlateNumber}
                     <div className="small text-muted">{record.vehicleModel} ({record.vehicleType})</div>
                   </div>
                 </td>
                 <td>
                   <div className="fw-bold">{record.title}</div>
                   <div className="small text-muted">{record.description.length > 50 ? record.description.substring(0, 50) + '...' : record.description}</div>
                 </td>
                 <td>
                   <div className="d-flex align-items-center">
                     <FontAwesomeIcon icon={faTachometerAlt} className="me-1 text-muted" />
                     {record.km} km
                   </div>
                 </td>
                 <td>
                   <div className={`badge rounded-pill text-bg-${statusStyle.color}`}>
                     <FontAwesomeIcon icon={statusStyle.icon} className="me-1" />
                     {statusStyle.label}
                   </div>
                 </td>
                 {(isAdmin || isMechanic) && (
                   <td>
                     <div className="d-flex align-items-center">
                       <div className="me-2 mechanic-avatar">
                         <FontAwesomeIcon icon={faUserMd} size="xs" />
                       </div>
                       <div>
                         {record.mechanicName}
                       </div>
                     </div>
                   </td>
                 )}
                 <td>
                   <div className="d-flex">
                     {hasProblemImage && (
                       <Badge bg="info" pill className="me-1">
                         <FontAwesomeIcon icon={faCamera} className="me-1" />
                         Foto
                       </Badge>
                     )}
                     {hasReceiptImage && (
                       <Badge bg="success" pill>
                         <FontAwesomeIcon icon={faReceipt} className="me-1" />
                         Bon
                       </Badge>
                     )}
                     {!hasProblemImage && !hasReceiptImage && (
                       <span className="text-muted small">Fără documente</span>
                     )}
                   </div>
                 </td>
                 <td>
                   <div className="d-flex">
                     <button 
                       className="btn btn-sm btn-primary me-1"
                       onClick={() => handleViewRecord(record)}
                       title="Vezi detalii"
                     >
                       <FontAwesomeIcon icon={faEye} />
                     </button>
                     
                     {(isAdmin || isMechanic || record.reporterId === user._id) && (
                       <>
                         <button 
                           className="btn btn-sm btn-warning me-1"
                           onClick={() => handleEditInit(record)}
                           title="Editează"
                         >
                           <FontAwesomeIcon icon={faPen} />
                         </button>
                         
                         {(isAdmin || isMechanic) && (
                           <button 
                             className="btn btn-sm btn-info me-1"
                             onClick={() => handleAssignInit(record)}
                             title="Asignează mecanic"
                             disabled={record.status === 'completed' || record.status === 'cancelled'}
                           >
                             <FontAwesomeIcon icon={faUserMd} />
                           </button>
                         )}
                         
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
             );
           })}
         </tbody>
       </table>
     </div>
     
     {filteredRecords.length === 0 && !loading && (
       <div className="text-center py-4">
         <p className="text-muted">Nu există înregistrări de service pentru ambulanțe.</p>
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
   <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" centered className="booking-modal">
     <Modal.Header closeButton>
       <Modal.Title>
         <FontAwesomeIcon icon={faPlus} className="me-2" />
         Adaugă Înregistrare Service
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
                         {vehicle.plateNumber} - {vehicle.model} ({vehicle.city})
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
                   <FontAwesomeIcon icon={faTools} className="me-2" />
                   Titlu problemă/lucrare *
                 </Form.Label>
                 <Form.Control 
                   type="text" 
                   name="title"
                   value={formData.title}
                   onChange={handleInputChange}
                   required
                   placeholder="Ex: Schimb ulei, Frâne, etc."
                 />
               </Form.Group>
             </div>
             <div className="col-md-6">
               <Form.Group className="mb-3">
                 <Form.Label>
                   <FontAwesomeIcon icon={faTachometerAlt} className="me-2" />
                   Kilometraj actual *
                 </Form.Label>
                 <Form.Control 
                   type="number" 
                   name="km"
                   value={formData.km}
                   onChange={handleInputChange}
                   required
                   min="0"
                 />
               </Form.Group>
             </div>
           </div>
           
           <Form.Group className="mb-3">
             <Form.Label>
               <FontAwesomeIcon icon={faComments} className="me-2" />
               Descriere problemă/lucrare *
             </Form.Label>
             <Form.Control 
               as="textarea" 
               rows={3}
               name="description"
               value={formData.description}
               onChange={handleInputChange}
               required
               placeholder="Descrieți detaliat problema sau lucrarea ce trebuie efectuată..."
             />
           </Form.Group>
           
           <div className="row mb-3">
             <div className="col-md-6">
               <Form.Group className="mb-3">
                 <Form.Label>
                   <FontAwesomeIcon icon={faSpinner} className="me-2" />
                   Status
                 </Form.Label>
                 <Form.Select
                   name="status"
                   value={formData.status}
                   onChange={handleInputChange}
                 >
                   {serviceStatusTypes.map(status => (
                     <option key={status.value} value={status.value}>
                       {status.label}</option>
                   ))}
                 </Form.Select>
               </Form.Group>
             </div>
             {(isAdmin || isMechanic) && (
               <div className="col-md-6">
                 <Form.Group className="mb-3">
                   <Form.Label>
                     <FontAwesomeIcon icon={faUserMd} className="me-2" />
                     Asignează Mecanic
                   </Form.Label>
                   <Form.Select
                     name="assignedTo"
                     value={formData.assignedTo}
                     onChange={handleInputChange}
                   >
                     <option value="">Fără mecanic asignat</option>
                     {mechanics.map(mechanic => (
                       <option key={mechanic._id} value={mechanic._id}>
                         {mechanic.name}
                       </option>
                     ))}
                   </Form.Select>
                 </Form.Group>
               </div>
             )}
           </div>
           
           <div className="row mb-3">
             <div className="col-md-6">
               <Form.Group className="mb-3">
                 <Form.Label>
                   <FontAwesomeIcon icon={faWrench} className="me-2" />
                   Piese înlocuite
                 </Form.Label>
                 <Form.Control 
                   type="text" 
                   name="partsReplaced"
                   value={formData.partsReplaced}
                   onChange={handleInputChange}
                   placeholder="Listați piesele înlocuite sau ce trebuie înlocuit..."
                 />
               </Form.Group>
             </div>
             <div className="col-md-6">
               <Form.Group className="mb-3">
                 <Form.Label>
                   <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                   Cost piese (RON)
                 </Form.Label>
                 <Form.Control 
                   type="number" 
                   step="0.01"
                   min="0"
                   name="partsCost"
                   value={formData.partsCost}
                   onChange={handleInputChange}
                 />
               </Form.Group>
             </div>
           </div>
           
           <div className="row mb-3">
             <div className="col-md-6">
               <Form.Group className="mb-3">
                 <Form.Label>
                   <FontAwesomeIcon icon={faTachometerAlt} className="me-2" />
                   Următorul service la km
                 </Form.Label>
                 <Form.Control 
                   type="number" 
                   name="nextServiceKm"
                   value={formData.nextServiceKm}
                   onChange={handleInputChange}
                   min="0"
                 />
               </Form.Group>
             </div>
             <div className="col-md-6">
               <Form.Group className="mb-3">
                 <Form.Label>
                   <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                   Note suplimentare
                 </Form.Label>
                 <Form.Control 
                   as="textarea" 
                   rows={2}
                   name="notes"
                   value={formData.notes}
                   onChange={handleInputChange}
                 />
               </Form.Group>
             </div>
           </div>
           
           {/* Secțiune pentru încărcarea imaginilor */}
           <div className="document-upload-section mt-4">
             <div className="row">
               <div className="col-md-6">
                 <h5 className="mb-3">
                   <FontAwesomeIcon icon={faCamera} className="me-2" />
                   Imagine Problemă
                 </h5>
                 
                 <div className="mb-3">
                   <div className="d-flex align-items-center">
                     <Button 
                       variant="outline-primary" 
                       className="me-2"
                       onClick={() => document.getElementById('add-problem-file').click()}
                     >
                       <FontAwesomeIcon icon={faFileUpload} className="me-2" />
                       Încarcă imagine
                     </Button>
                     
                     <Button 
                       variant="outline-info" 
                       onClick={() => document.getElementById('add-problem-camera').click()}
                     >
                       <FontAwesomeIcon icon={faCamera} className="me-2" />
                       Fă o poză
                     </Button>
                     
                     <input
                       type="file"
                       id="add-problem-file"
                       style={{ display: 'none' }}
                       onChange={(e) => handleFileChange(e, 'problem')}
                       accept="image/*"
                     />
                     
                     <input
                       type="file"
                       id="add-problem-camera"
                       style={{ display: 'none' }}
                       onChange={(e) => handleFileChange(e, 'problem')}
                       accept="image/*"
                       capture="environment"
                     />
                   </div>
                 </div>
                 
                 {selectedProblemFile && (
                   <div className="selected-file-info mb-3">
                     <div className="d-flex justify-content-between align-items-center">
                       <div>
                         <FontAwesomeIcon icon={getFileIcon(selectedProblemFile.type)} className="me-2" />
                         <span>{selectedProblemFile.name}</span> 
                         <span className="text-muted ms-2">({formatFileSize(selectedProblemFile.size)})</span>
                       </div>
                       <Button 
                         variant="outline-danger" 
                         size="sm"
                         onClick={() => setSelectedProblemFile(null)}
                       >
                         <FontAwesomeIcon icon={faTrash} />
                       </Button>
                     </div>
 
                     {isUploading && activeImageType === 'problem' && (
                       <ProgressBar 
                         now={uploadProgress} 
                         label={`${uploadProgress}%`}
                         className="mt-2" 
                         variant="info" 
                         animated
                       />
                     )}
                   </div>
                 )}
               </div>
               
               <div className="col-md-6">
                 <h5 className="mb-3">
                   <FontAwesomeIcon icon={faReceipt} className="me-2" />
                   Bon/Factură
                 </h5>
                 
                 <div className="mb-3">
                   <div className="d-flex align-items-center">
                     <Button 
                       variant="outline-primary" 
                       className="me-2"
                       onClick={() => document.getElementById('add-receipt-file').click()}
                     >
                       <FontAwesomeIcon icon={faFileUpload} className="me-2" />
                       Încarcă bon
                     </Button>
                     
                     <Button 
                       variant="outline-info" 
                       onClick={() => document.getElementById('add-receipt-camera').click()}
                     >
                       <FontAwesomeIcon icon={faCamera} className="me-2" />
                       Fă o poză
                     </Button>
                     
                     <input
                       type="file"
                       id="add-receipt-file"
                       style={{ display: 'none' }}
                       onChange={(e) => handleFileChange(e, 'receipt')}
                       accept="image/*,application/pdf"
                     />
                     
                     <input
                       type="file"
                       id="add-receipt-camera"
                       style={{ display: 'none' }}
                       onChange={(e) => handleFileChange(e, 'receipt')}
                       accept="image/*"
                       capture="environment"
                     />
                   </div>
                 </div>
                 
                 {selectedReceiptFile && (
                   <div className="selected-file-info mb-3">
                     <div className="d-flex justify-content-between align-items-center">
                       <div>
                         <FontAwesomeIcon icon={getFileIcon(selectedReceiptFile.type)} className="me-2" />
                         <span>{selectedReceiptFile.name}</span> 
                         <span className="text-muted ms-2">({formatFileSize(selectedReceiptFile.size)})</span>
                       </div>
                       <Button 
                         variant="outline-danger" 
                         size="sm"
                         onClick={() => setSelectedReceiptFile(null)}
                       >
                         <FontAwesomeIcon icon={faTrash} />
                       </Button>
                     </div>
 
                     {isUploading && activeImageType === 'receipt' && (
                       <ProgressBar 
                         now={uploadProgress} 
                         label={`${uploadProgress}%`}
                         className="mt-2" 
                         variant="info" 
                         animated
                       />
                     )}
                   </div>
                 )}
               </div>
             </div>
           </div>
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
         disabled={loadingVehicles || loadingCities || isUploading}
       >
         Salvează înregistrare
       </Button>
     </Modal.Footer>
   </Modal>
 );
 
 const renderEditRecordModal = () => (
   <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered className="booking-modal">
     <Modal.Header closeButton>
       <Modal.Title>
         <FontAwesomeIcon icon={faPen} className="me-2" />
         Editează Înregistrare Service
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
                         {vehicle.plateNumber} - {vehicle.model} ({vehicle.city})
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
                   <FontAwesomeIcon icon={faTools} className="me-2" />
                   Titlu problemă/lucrare *
                 </Form.Label>
                 <Form.Control 
                   type="text" 
                   name="title"
                   value={formData.title}
                   onChange={handleInputChange}
                   required
                 />
               </Form.Group>
             </div>
             <div className="col-md-6">
               <Form.Group className="mb-3">
                 <Form.Label>
                   <FontAwesomeIcon icon={faTachometerAlt} className="me-2" />
                   Kilometraj actual *
                 </Form.Label>
                 <Form.Control 
                   type="number" 
                   name="km"
                   value={formData.km}
                   onChange={handleInputChange}
                   required
                   min="0"
                 />
               </Form.Group>
             </div>
           </div>
           
           <Form.Group className="mb-3">
             <Form.Label>
               <FontAwesomeIcon icon={faComments} className="me-2" />
               Descriere problemă/lucrare *
             </Form.Label>
             <Form.Control 
               as="textarea" 
               rows={3}
               name="description"
               value={formData.description}
               onChange={handleInputChange}
               required
             />
           </Form.Group>
           
           <div className="row mb-3">
             <div className="col-md-6">
               <Form.Group className="mb-3">
                 <Form.Label>
                   <FontAwesomeIcon icon={faSpinner} className="me-2" />
                   Status
                 </Form.Label>
                 <Form.Select
                   name="status"
                   value={formData.status}
                   onChange={handleInputChange}
                 >
                   {serviceStatusTypes.map(status => (
                     <option key={status.value} value={status.value}>
                       {status.label}
                     </option>
                   ))}
                 </Form.Select>
               </Form.Group>
             </div>
             {(isAdmin || isMechanic) && (
               <div className="col-md-6">
                 <Form.Group className="mb-3">
                   <Form.Label>
                     <FontAwesomeIcon icon={faUserMd} className="me-2" />
                     Asignează Mecanic
                   </Form.Label>
                   <Form.Select
                     name="assignedTo"
                     value={formData.assignedTo}
                     onChange={handleInputChange}
                   >
                     <option value="">Fără mecanic asignat</option>
                     {mechanics.map(mechanic => (
                       <option key={mechanic._id} value={mechanic._id}>
                         {mechanic.name}
                       </option>
                     ))}
                   </Form.Select>
                 </Form.Group>
               </div>
             )}
           </div>
           
           <div className="row mb-3">
             <div className="col-md-6">
               <Form.Group className="mb-3">
                 <Form.Label>
                   <FontAwesomeIcon icon={faWrench} className="me-2" />
                   Piese înlocuite
                 </Form.Label>
                 <Form.Control 
                   type="text" 
                   name="partsReplaced"
                   value={formData.partsReplaced}
                   onChange={handleInputChange}
                 />
               </Form.Group>
             </div>
             <div className="col-md-6">
               <Form.Group className="mb-3">
                 <Form.Label>
                   <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                   Cost piese (RON)
                 </Form.Label>
                 <Form.Control 
                   type="number" 
                   step="0.01"
                   min="0"
                   name="partsCost"
                   value={formData.partsCost}
                   onChange={handleInputChange}
                 />
               </Form.Group>
             </div>
           </div>
           
           <div className="row mb-3">
             <div className="col-md-6">
               <Form.Group className="mb-3">
                 <Form.Label>
                   <FontAwesomeIcon icon={faTachometerAlt} className="me-2" />
                   Următorul service la km
                 </Form.Label>
                 <Form.Control 
                   type="number" 
                   name="nextServiceKm"
                   value={formData.nextServiceKm}
                   onChange={handleInputChange}
                   min="0"
                 />
               </Form.Group>
             </div>
             <div className="col-md-6">
               <Form.Group className="mb-3">
                 <Form.Label>
                   <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                   Note suplimentare
                 </Form.Label>
                 <Form.Control 
                   as="textarea" 
                   rows={2}
                   name="notes"
                   value={formData.notes}
                   onChange={handleInputChange}
                 />
               </Form.Group>
             </div>
           </div>
           
           <div className="alert alert-info">
             <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
             Imaginile pot fi gestionate din vizualizarea detaliată a înregistrării.
           </div>
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
 
 const renderAssignMechanicModal = () => (
    <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered className="booking-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faUserMd} className="me-2" />
          Asignează Mecanic
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loadingMechanics ? (
          <div className="text-center py-3">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2">Se încarcă mecanicii disponibili...</p>
          </div>
        ) : (
          <>
            {recordToAssign && (
              <div className="mb-3">
                <h6>Detalii înregistrare:</h6>
                <p><strong>Ambulanță:</strong> {recordToAssign.vehiclePlateNumber}</p>
                <p><strong>Titlu:</strong> {recordToAssign.title}</p>
                <p>
                  <strong>Status:</strong> 
                  <span className={`badge text-bg-${getStatusStyle(recordToAssign.status).color} ms-2`}>
                    <FontAwesomeIcon icon={getStatusStyle(recordToAssign.status).icon} className="me-1" />
                    {getStatusStyle(recordToAssign.status).label}
                  </span>
                </p>
              </div>
            )}
            
            <Form onSubmit={handleAssignSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FontAwesomeIcon icon={faUserMd} className="me-2" />
                  Selectează mecanic *
                </Form.Label>
                {mechanics.length > 0 ? (
                  <>
                    {/* Pentru debugging */}
                    <div style={{ display: 'none' }}>
                      {console.log('Mecanici disponibili pentru dropdown:', mechanics)}
                    </div>
                    <Form.Select
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Selectează un mecanic</option>
                      {mechanics.map(mechanic => (
                        <option key={mechanic._id} value={mechanic._id}>
                          {mechanic.name} {mechanic.city ? `(${mechanic.city})` : ''}
                        </option>
                      ))}
                    </Form.Select>
                  </>
                ) : (
                  <div className="alert alert-warning">
                    Nu există mecanici disponibili. Adăugați mecanici în sistem pentru a putea asigna lucrări.
                  </div>
                )}
              </Form.Group>
              
              <div className="alert alert-info">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                Asignarea unui mecanic va schimba automat statusul din <strong>În așteptare</strong> în <strong>În lucru</strong> dacă este cazul.
              </div>
            </Form>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
          Anulează
        </Button>
        <Button 
          variant="primary" 
          onClick={handleAssignSubmit}
          disabled={loadingMechanics || !formData.assignedTo}
        >
          Asignează mecanic
        </Button>
      </Modal.Footer>
    </Modal>
  );
 
 const renderViewRecordModal = () => (
   <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered className="booking-modal">
     <Modal.Header closeButton>
       <Modal.Title>Detalii Înregistrare Service</Modal.Title>
     </Modal.Header>
     <Modal.Body>
       {currentRecord && (
         <div className="record-details">
           <div className="mb-4">
             <h5 className="mb-3">Informații Generale</h5>
             <div className="row">
               <div className="col-md-6">
                 <p>
                   <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                   <strong>Data raportării:</strong> {formatDate(currentRecord.date)}
                 </p>
                 <p>
                   <FontAwesomeIcon icon={faAmbulance} className="me-2" />
                   <strong>Ambulanță:</strong> {currentRecord.vehiclePlateNumber}
                 </p>
                 <p>
                   <FontAwesomeIcon icon={faCar} className="me-2" />
                   <strong>Model:</strong> {currentRecord.vehicleModel} ({currentRecord.vehicleType})
                 </p>
                 <p>
                   <FontAwesomeIcon icon={faTachometerAlt} className="me-2" />
                   <strong>Kilometraj:</strong> {currentRecord.km} km
                 </p>
                 <p>
                   <FontAwesomeIcon icon={faCity} className="me-2" />
                   <strong>Oraș:</strong> {currentRecord.city}
                 </p>
               </div>
               <div className="col-md-6">
                 <p>
                   <FontAwesomeIcon 
                     icon={getStatusStyle(currentRecord.status).icon} 
                     className={`me-2 text-${getStatusStyle(currentRecord.status).color}`} 
                   />
                   <strong>Status:</strong> {getStatusStyle(currentRecord.status).label}
                 </p>
                 {currentRecord.completionDate && (
                   <p>
                     <FontAwesomeIcon icon={faCheckCircle} className="me-2 text-success" />
                     <strong>Data finalizării:</strong> {formatDate(currentRecord.completionDate)}
                   </p>
                 )}
                 <p>
                   <FontAwesomeIcon icon={faUser} className="me-2" />
                   <strong>Raportat de:</strong> {currentRecord.reporterName}
                 </p>
                 <p>
                   <FontAwesomeIcon icon={faUserMd} className="me-2" />
                   <strong>Mecanic asignat:</strong> {currentRecord.mechanicName}
                 </p>
                 {currentRecord.nextServiceKm && (
                   <p>
                     <FontAwesomeIcon icon={faTachometerAlt} className="me-2" />
                     <strong>Următorul service la:</strong> {currentRecord.nextServiceKm} km
                   </p>
                 )}
               </div>
             </div>
           </div>
           
           <div className="mb-4">
             <h5 className="mb-3">Detalii Problemă/Lucrare</h5>
             <p><strong>Titlu:</strong> {currentRecord.title}</p>
             <p><strong>Descriere:</strong></p>
             <p className="border p-2 rounded bg-light">{currentRecord.description}</p>
             
             {currentRecord.partsReplaced && (
               <p><strong>Piese înlocuite:</strong> {currentRecord.partsReplaced}</p>
             )}
             
             {currentRecord.partsCost > 0 && (
               <p><strong>Cost piese:</strong> {formatAmount(currentRecord.partsCost)}</p>
             )}
             
             {currentRecord.notes && (
               <>
                 <p><strong>Note suplimentare:</strong></p>
                 <p className="border p-2 rounded bg-light">{currentRecord.notes}</p>
               </>
             )}
           </div>
           
           <div className="mb-4">
             <h5 className="d-flex justify-content-between align-items-center mb-3">
               <span>Imagine Problemă</span>
               <div>
                 <Button 
                   variant="outline-primary" 
                   size="sm"
                   onClick={() => document.getElementById('problem-upload').click()}
                   className="me-2"
                 >
                   <FontAwesomeIcon icon={faFileUpload} className="me-1" />
                   Încarcă imagine
                 </Button>
                 <Button 
                   variant="outline-info" 
                   size="sm"
                   onClick={() => document.getElementById('problem-camera').click()}
                 >
                   <FontAwesomeIcon icon={faCamera} className="me-1" />
                   Fă o poză
                 </Button>
               </div>
             </h5>
             
             <input
               type="file"
               id="problem-upload"
               style={{ display: 'none' }}
               onChange={(e) => handleFileChange(e, 'problem')}
               accept="image/*"
             />
             
             <input
               type="file"
               id="problem-camera"
               style={{ display: 'none' }}
               onChange={(e) => handleFileChange(e, 'problem')}
               accept="image/*"
               capture="environment"
             />
             
             {selectedProblemFile && (
               <div className="selected-file-info mb-3">
                 <div className="d-flex justify-content-between align-items-center">
                   <div>
                     <FontAwesomeIcon icon={getFileIcon(selectedProblemFile.type)} className="me-2" />
                     <span>{selectedProblemFile.name}</span> 
                     <span className="text-muted ms-2">({formatFileSize(selectedProblemFile.size)})</span>
                   </div>
                   <div>
                     <Button 
                       variant="primary" 
                       size="sm"
                       className="me-2"
                       onClick={() => handleUploadImage(currentRecord._id, 'problem')}
                       disabled={isUploading}
                     >
                       {isUploading && activeImageType === 'problem' ? 'Se încarcă...' : 'Încarcă'}
                     </Button>
                     <Button 
                       variant="outline-danger" 
                       size="sm"
                       onClick={() => setSelectedProblemFile(null)}
                     >
                       <FontAwesomeIcon icon={faTrash} />
                     </Button>
                   </div>
                 </div>
 
                 {isUploading && activeImageType === 'problem' && (
                   <ProgressBar 
                     now={uploadProgress} 
                     label={`${uploadProgress}%`}
                     className="mt-2" 
                     variant="info" 
                     animated
                   />
                 )}
               </div>
             )}
             
             {currentRecord.problemImage ? (
               <div className="image-container">
                 <div className="d-flex justify-content-between align-items-center mb-2">
                   <h6 className="mb-0">Imagine atașată:</h6>
                   <div>
                     <Button 
                       variant="outline-primary" 
                       size="sm" 
                       className="me-2"
                       onClick={() => handleDownloadImage(currentRecord._id, 'problem')}
                     >
                       <FontAwesomeIcon icon={faDownload} className="me-1" />
                       Descarcă
                     </Button>
                   </div>
                 </div>
                 <div className="image-preview border rounded p-2">
                   <img 
                     src={`/uploads/${currentRecord.problemImage.replace(/^uploads\//, '')}`} 
                     alt="Imagine problemă" 
                     className="img-fluid" 
                     style={{ maxHeight: '300px', display: 'block', margin: '0 auto' }}
                   />
                 </div>
               </div>
             ) : (
               <div className="text-center py-3 border rounded">
                 <p className="text-muted mb-0">
                   <FontAwesomeIcon icon={faCamera} className="me-2" />
                   Nu există imagine atașată. Încărcați o imagine pentru această înregistrare.
                 </p>
               </div>
             )}
           </div>
           
           <div className="mb-4">
             <h5 className="d-flex justify-content-between align-items-center mb-3">
               <span>Bon/Factură</span>
               <div>
                 <Button 
                   variant="outline-primary" 
                   size="sm"
                   onClick={() => document.getElementById('receipt-upload').click()}
                   className="me-2"
                 >
                   <FontAwesomeIcon icon={faFileUpload} className="me-1" />
                   Încarcă bon
                 </Button>
                 <Button 
variant="outline-info" 
size="sm"
onClick={() => document.getElementById('receipt-camera').click()}
>
<FontAwesomeIcon icon={faCamera} className="me-1" />
Fă o poză
</Button>
</div>
</h5>

<input
type="file"
id="receipt-upload"
style={{ display: 'none' }}
onChange={(e) => handleFileChange(e, 'receipt')}
accept="image/*,application/pdf"
/>

<input
type="file"
id="receipt-camera"
style={{ display: 'none' }}
onChange={(e) => handleFileChange(e, 'receipt')}
accept="image/*"
capture="environment"
/>

{selectedReceiptFile && (
<div className="selected-file-info mb-3">
<div className="d-flex justify-content-between align-items-center">
<div>
  <FontAwesomeIcon icon={getFileIcon(selectedReceiptFile.type)} className="me-2" />
  <span>{selectedReceiptFile.name}</span> 
  <span className="text-muted ms-2">({formatFileSize(selectedReceiptFile.size)})</span>
</div>
<div>
  <Button 
    variant="primary" 
    size="sm"
    className="me-2"
    onClick={() => handleUploadImage(currentRecord._id, 'receipt')}
    disabled={isUploading}
  >
    {isUploading && activeImageType === 'receipt' ? 'Se încarcă...' : 'Încarcă'}
  </Button>
  <Button 
    variant="outline-danger" 
    size="sm"
    onClick={() => setSelectedReceiptFile(null)}
  >
    <FontAwesomeIcon icon={faTrash} />
  </Button>
</div>
</div>

{isUploading && activeImageType === 'receipt' && (
<ProgressBar 
  now={uploadProgress} 
  label={`${uploadProgress}%`}
  className="mt-2" 
  variant="info" 
  animated
/>
)}
</div>
)}

{currentRecord.receiptImage ? (
<div className="image-container">
<div className="d-flex justify-content-between align-items-center mb-2">
<h6 className="mb-0">Bon/factură atașat(ă):</h6>
<div>
  <Button 
    variant="outline-primary" 
    size="sm" 
    className="me-2"
    onClick={() => handleDownloadImage(currentRecord._id, 'receipt')}
  >
    <FontAwesomeIcon icon={faDownload} className="me-1" />
    Descarcă
  </Button>
</div>
</div>
<div className="image-preview border rounded p-2">
<img 
  src={`/uploads/${currentRecord.receiptImage.replace(/^uploads\//, '')}`} 
  alt="Bon/factură" 
  className="img-fluid" 
  style={{ maxHeight: '300px', display: 'block', margin: '0 auto' }}
/>
</div>
</div>
) : (
<div className="text-center py-3 border rounded">
<p className="text-muted mb-0">
<FontAwesomeIcon icon={faReceipt} className="me-2" />
Nu există bon/factură atașat(ă). Încărcați un bon/factură pentru această înregistrare.
</p>
</div>
)}
</div>
</div>
)}
</Modal.Body>
<Modal.Footer>
<Button variant="secondary" onClick={() => setShowViewModal(false)}>
Închide
</Button>
{currentRecord && (isAdmin || isMechanic || currentRecord.reporterId === user._id) && (
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
<Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered className="booking-modal">
<Modal.Header closeButton>
<Modal.Title>Confirmare ștergere</Modal.Title>
</Modal.Header>
<Modal.Body>
{recordToDelete && (
<div>
<p>
Sunteți sigur că doriți să ștergeți înregistrarea de service cu titlul <strong>"{recordToDelete.title}"</strong> pentru ambulanța <strong>{recordToDelete.vehiclePlateNumber}</strong> din data <strong>{formatDate(recordToDelete.date)}</strong>?
</p>
{(recordToDelete.problemImage || recordToDelete.receiptImage) && (
<div className="alert alert-danger mt-2">
<FontAwesomeIcon icon={faInfoCircle} className="me-1" />
<strong>Atenție!</strong> Această înregistrare are documente atașate care vor fi șterse permanent:
<ul className="mb-0 mt-1">
{recordToDelete.problemImage && (
<li>Imagine problemă</li>
)}
{recordToDelete.receiptImage && (
<li>Bon/factură</li>
)}
</ul>
</div>
)}
</div>
)}
</Modal.Body>
<Modal.Footer>
<Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
Anulează
</Button>
<Button variant="danger" onClick={handleDeleteConfirm}>
<FontAwesomeIcon icon={faTrash} className="me-1" />
Șterge înregistrare
</Button>
</Modal.Footer>
</Modal>
);

// Adăugăm stilizare CSS pentru funcționalitățile noi
const customStyles = `
.image-container {
background-color: #f8f9fa;
border-radius: 8px;
padding: 15px;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.selected-file-info {
padding: 10px;
border: 1px solid #dee2e6;
border-radius: 4px;
background-color: #f8f9fa;
}

.mechanic-avatar {
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
<FontAwesomeIcon icon={faTools} className="me-2" />
Gestionare Service Ambulanțe
</h1>
</div>

{renderStats()}
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
renderRecordsTable()
)}

{renderAddRecordModal()}
{renderViewRecordModal()}
{renderEditRecordModal()}
{renderAssignMechanicModal()}
{renderDeleteConfirmModal()}
</div>
</Layout>
);
};

export default AmbulanceService;