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
  faGasPump,
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
  faMoneyBillWave,
  faCreditCard,
  faReceipt,
  faCoins
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import { Modal, Button, Form, Badge, ProgressBar } from 'react-bootstrap';

const Fuel = () => {
  const { user } = useSelector(state => state.auth);
  const isAdmin = user && user.role === 'admin';
  
  const [fuelRecords, setFuelRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [fuelStats, setFuelStats] = useState({
    cardLoad: { totalAmount: 0, count: 0 },
    fuelConsumption: { totalAmount: 0, count: 0 },
    remainingBudget: 0
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState(null);
  
  // State pentru încărcarea documentelor
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'cardLoad',
    amount: '',
    gasStation: '',
    vehicle: '',
    notes: '',
    cityId: ''
  });

  const fuelTypes = [
    { value: 'cardLoad', label: 'Încărcare card', icon: faCreditCard },
    { value: 'fuelConsumption', label: 'Consum carburant', icon: faGasPump }
  ];
  
  useEffect(() => {
    if (user) {
      fetchVehicles();
      fetchCities();
      fetchFuelStats();
    }
  }, [user]);
  
  useEffect(() => {
    if (user && vehicles.length > 0) {
      fetchFuelRecords();
    }
  }, [user, vehicles]);
  
  const fetchFuelRecords = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/fuel');
      
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
              } else if (cityId === '6823053af3c9fed99da59f39') {
                cityName = 'Suceava';
              } else if (cityId === '6823053af3c9fed99da59f3a') {
                cityName = 'Botoșani';
              }
            }
          }
          
          // Extragem informații despre vehicul
          let vehiclePlateNumber = 'N/A';
          let vehicleId = null;
          
          if (record.vehicle) {
            if (typeof record.vehicle === 'object') {
              vehiclePlateNumber = record.vehicle.plateNumber || 'N/A';
              vehicleId = record.vehicle._id;
            } else if (typeof record.vehicle === 'string') {
              vehicleId = record.vehicle;
              const foundVehicle = vehicles.find(v => v._id === vehicleId);
              if (foundVehicle) {
                vehiclePlateNumber = foundVehicle.plateNumber;
              }
            }
          }
          
          // Extragem numele asistentului
          let assistantName = 'Nealocat';
          let assistantId = null;
          
          if (record.assistant) {
            if (typeof record.assistant === 'object') {
              assistantName = record.assistant.name || 'Nealocat';
              assistantId = record.assistant._id;
            } else if (typeof record.assistant === 'string') {
              assistantId = record.assistant;
              
              if (assistantId === user._id) {
                assistantName = user.name;
              } else {
                try {
                  const userResponse = await axios.get(`/api/users/${assistantId}`);
                  if (userResponse.data && userResponse.data.data) {
                    assistantName = userResponse.data.data.name || 'Asistent';
                  }
                } catch (error) {
                  console.error(`Nu s-a putut obține asistentul cu ID ${assistantId}:`, error);
                }
              }
            }
          }
          
          return {
            _id: record._id,
            date: formattedDate,
            type: record.type,
            amount: record.amount,
            gasStation: record.gasStation || '',
            vehiclePlateNumber,
            vehicleId,
            city: cityName,
            cityId,
            assistantName,
            assistantId,
            notes: record.notes || '',
            receiptImage: record.receiptImage,
          };
        }));
        
        const userCityId = user.city && typeof user.city === 'object' 
          ? user.city._id 
          : typeof user.city === 'string' 
            ? user.city 
            : null;
            
        const filteredRecords = isAdmin 
          ? recordsData 
          : recordsData.filter(record => record.cityId === userCityId);
        
        setFuelRecords(filteredRecords);
      } else {
        console.warn('Nu s-au găsit înregistrări de carburant în răspunsul API-ului sau formatul datelor este incorect.');
        setFuelRecords([]);
      }
      
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Eroare la încărcarea înregistrărilor de carburant:', err);
      setError(err.response?.data?.message || 'Nu s-au putut obține înregistrările. Vă rugăm să reîncercați mai târziu.');
      setLoading(false);
      setFuelRecords([]);
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
      
      const hardcodedCities = [
        { _id: '6823053af3c9fed99da59f39', name: 'Suceava' },
        { _id: '6823053af3c9fed99da59f3a', name: 'Botoșani' }
      ];
      
      setCities(hardcodedCities);
      
      if (!isAdmin && user.city) {
        const userCityId = typeof user.city === 'object' ? user.city._id : user.city;
        setFormData(prevData => ({
          ...prevData,
          cityId: userCityId
        }));
      }
      
      setLoadingCities(false);
    }
  };
  
  const fetchVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const response = await axios.get('/api/vehicles');
      
      if (response.data && response.data.data) {
        const allVehicles = response.data.data;
        
        const vehicles = allVehicles.map(vehicle => ({
          _id: vehicle._id,
          plateNumber: vehicle.plateNumber,
          city: vehicle.city && typeof vehicle.city === 'object' && vehicle.city.name 
            ? vehicle.city.name 
            : typeof vehicle.city === 'string' 
              ? (vehicle.city === '6823053af3c9fed99da59f39' ? 'Suceava' : 
                 vehicle.city === '6823053af3c9fed99da59f3a' ? 'Botoșani' : 'Oraș necunoscut')
              : 'Oraș necunoscut',
          cityId: vehicle.city && typeof vehicle.city === 'object' && vehicle.city._id 
            ? vehicle.city._id 
            : typeof vehicle.city === 'string' 
              ? vehicle.city 
              : null
        }));
        
        const userCityId = user.city && typeof user.city === 'object' 
          ? user.city._id 
          : typeof user.city === 'string' 
            ? user.city 
            : null;
        
        const filteredVehicles = isAdmin 
          ? vehicles 
          : vehicles.filter(vehicle => vehicle.cityId === userCityId);
        
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
  
  const fetchFuelStats = async () => {
    try {
      const response = await axios.get('/api/fuel/stats');
      
      if (response.data && response.data.data) {
        setFuelStats(response.data.data);
      }
    } catch (err) {
      console.error('Eroare la încărcarea statisticilor de carburant:', err);
    }
  };
  
  const filteredRecords = fuelRecords.filter(record => {
    const matchesSearch = 
      searchTerm === '' || 
      (record.vehiclePlateNumber && record.vehiclePlateNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.gasStation && record.gasStation.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCity = cityFilter === '' || record.city === cityFilter;
    
    const matchesDate = dateFilter === '' || 
      record.date === dateFilter;
    
    const matchesType = typeFilter === '' || record.type === typeFilter;
    
    const matchesVehicle = vehicleFilter === '' || record.vehicleId === vehicleFilter;
    
    return matchesSearch && matchesCity && matchesDate && matchesType && matchesVehicle;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'asc' 
        ? dateA - dateB 
        : dateB - dateA;
    } else if (sortBy === 'amount') {
      return sortOrder === 'asc'
        ? a.amount - b.amount
        : b.amount - a.amount;
    } else if (sortBy === 'vehicle') {
      return sortOrder === 'asc'
        ? a.vehiclePlateNumber.localeCompare(b.vehiclePlateNumber)
        : b.vehiclePlateNumber.localeCompare(a.vehiclePlateNumber);
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
  
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };
  
  const handleUploadReceipt = async (recordId) => {
    if (!selectedFile) {
      alert('Vă rugăm să selectați un fișier');
      return;
    }
    
    const formData = new FormData();
    formData.append('receipt', selectedFile);
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const response = await axios.post(
        `/api/fuel/${recordId}/upload-receipt`,
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
        setSelectedFile(null);
        alert('Bonul a fost încărcat cu succes!');
        
        // Reîncarcă înregistrarea pentru a obține imaginea actualizată
        try {
          const recordResponse = await axios.get(`/api/fuel/${recordId}`);
          
          if (recordResponse.data && recordResponse.data.success) {
            const updatedRecord = recordResponse.data.data;
            
            // Actualizăm înregistrarea curentă dacă este cea care se afișează
            if (currentRecord && currentRecord._id === recordId) {
              setCurrentRecord({
                ...currentRecord,
                receiptImage: updatedRecord.receiptImage
              });
            }
            
            // Actualizăm și lista generală
            setFuelRecords(prevRecords => 
              prevRecords.map(r => 
                r._id === recordId ? {
                  ...r,
                  receiptImage: updatedRecord.receiptImage
                } : r
              )
            );
          }
        } catch (fetchErr) {
          console.error('Eroare la reîncărcarea înregistrării după încărcare bon:', fetchErr);
        }
      }
    } catch (err) {
      console.error('Eroare la încărcarea bonului:', err);
      alert(`Eroare: ${err.response?.data?.message || 'Nu s-a putut încărca bonul'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  const handleDownloadReceipt = async (recordId) => {
    try {
      const response = await axios.get(`/api/fuel/${recordId}/receipt/download`, {
        responseType: 'blob'
      });
      
      // Creăm un URL pentru blob și descărcăm fișierul
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bon_${recordId}.jpg`);
      document.body.appendChild(link);
      link.click();
      
      // Curat elementul și eliberez URL-ul
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Eroare la descărcarea bonului:', err);
      alert(`Eroare: ${err.response?.data?.message || 'Nu s-a putut descărca bonul'}`);
    }
  };
  
  const handleViewRecord = (record) => {
    setCurrentRecord(record);
    setShowViewModal(true);
  };
  
  const handleAddNewRecord = () => {
    const initialFormData = {
      date: new Date().toISOString().split('T')[0],
      type: 'cardLoad',
      amount: '',
      gasStation: '',
      vehicle: '',
      notes: '',
      cityId: ''
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
    
    if (name === 'type' && value === 'cardLoad') {
      // Dacă tipul se schimbă în încărcare card, eliminăm vehiculul și stația
      setFormData({
        ...formData,
        [name]: value,
        vehicle: '',
        gasStation: ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleEditInit = (record) => {
    // Populăm formularul cu datele înregistrării existente
    setFormData({
      date: record.date,
      type: record.type,
      amount: record.amount,
      gasStation: record.gasStation || '',
      vehicle: record.vehicleId || '',
      notes: record.notes || '',
      cityId: record.cityId
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
      await axios.delete(`/api/fuel/${recordToDelete._id}`);
      
      setFuelRecords(fuelRecords.filter(r => r._id !== recordToDelete._id));
      
      setShowDeleteConfirm(false);
      setRecordToDelete(null);
      
      alert('Înregistrarea a fost ștearsă cu succes');
      
      // Reîncărcăm statisticile
      fetchFuelStats();
    } catch (err) {
      console.error('Eroare la ștergere:', err);
      alert(`Eroare: ${err.response?.data?.message || 'Nu s-a putut șterge înregistrarea'}`);
      setShowDeleteConfirm(false);
    }
  };
  
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.cityId) {
        alert('Vă rugăm să selectați un oraș!');
        return;
      }
      
      if (formData.type === 'fuelConsumption' && !formData.vehicle) {
        alert('Pentru consum de carburant trebuie specificat vehiculul!');
        return;
      }
      
      if (formData.type === 'fuelConsumption' && !formData.gasStation) {
        alert('Pentru consum de carburant trebuie specificată stația!');
        return;
      }
      
      const recordData = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        date: formData.date,
        city: formData.cityId,
        notes: formData.notes
      };
      
      if (formData.type === 'fuelConsumption') {
        recordData.vehicle = formData.vehicle;
        recordData.gasStation = formData.gasStation;
      }
      
      const response = await axios.put(`/api/fuel/${recordToEdit._id}`, recordData);
      
      if (response.data && response.data.success) {
        const selectedCity = cities.find(city => city._id === formData.cityId);
        const cityName = selectedCity ? selectedCity.name : 'Necunoscut';
        
        let vehiclePlateNumber = 'N/A';
        if (formData.type === 'fuelConsumption' && formData.vehicle) {
          const foundVehicle = vehicles.find(v => v._id === formData.vehicle);
          vehiclePlateNumber = foundVehicle ? foundVehicle.plateNumber : 'N/A';
        }
        
        const updatedRecord = {
          ...recordToEdit,
          date: formData.date,
          type: formData.type,
          amount: parseFloat(formData.amount),
          gasStation: formData.type === 'fuelConsumption' ? formData.gasStation : '',
          vehiclePlateNumber: formData.type === 'fuelConsumption' ? vehiclePlateNumber : 'N/A',
          vehicleId: formData.type === 'fuelConsumption' ? formData.vehicle : null,
          city: cityName,
          cityId: formData.cityId,
          notes: formData.notes
        };
        
        setFuelRecords(prevRecords => 
          prevRecords.map(r => 
            r._id === recordToEdit._id ? updatedRecord : r
          )
        );
        
        setShowEditModal(false);
        setRecordToEdit(null);
        
        // Resetăm formularul
        setFormData({
          date: new Date().toISOString().split('T')[0],
          type: 'cardLoad',
          amount: '',
          gasStation: '',
          vehicle: '',
          notes: '',
          cityId: ''
        });
        
        alert('Înregistrarea a fost actualizată cu succes!');
        
        // Reîncărcăm statisticile
        fetchFuelStats();
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
      
      if (formData.type === 'fuelConsumption' && !formData.vehicle) {
        alert('Pentru consum de carburant trebuie specificat vehiculul!');
        return;
      }
      
      if (formData.type === 'fuelConsumption' && !formData.gasStation) {
        alert('Pentru consum de carburant trebuie specificată stația!');
        return;
      }
      
      const recordData = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        date: formData.date,
        city: formData.cityId,
        notes: formData.notes
      };
      
      if (formData.type === 'fuelConsumption') {
        recordData.vehicle = formData.vehicle;
        recordData.gasStation = formData.gasStation;
      }
      
      const response = await axios.post('/api/fuel', recordData);
      
      if (response.data && response.data.data) {
        const createdRecord = response.data.data;
        
        // Încarcă bonul după crearea înregistrării, dacă există un fișier selectat
        if (selectedFile) {
          try {
            setIsUploading(true);
            setUploadProgress(0);
            
            const receiptFormData = new FormData();
            receiptFormData.append('receipt', selectedFile);
            
            await axios.post(
              `/api/fuel/${createdRecord._id}/upload-receipt`,
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
            console.error('Eroare la încărcarea bonului:', uploadErr);
            alert(`Înregistrarea a fost creată, dar a apărut o eroare la încărcarea bonului: ${uploadErr.response?.data?.message || 'Eroare la încărcare'}`);
          } finally {
            setIsUploading(false);
            setUploadProgress(0);
            setSelectedFile(null);
          }
        }
        
        const selectedCity = cities.find(city => city._id === formData.cityId);
        const cityName = selectedCity ? selectedCity.name : 'Necunoscut';
        
        let vehiclePlateNumber = 'N/A';
        if (formData.type === 'fuelConsumption' && formData.vehicle) {
          const foundVehicle = vehicles.find(v => v._id === formData.vehicle);
          vehiclePlateNumber = foundVehicle ? foundVehicle.plateNumber : 'N/A';
        }
        
        const newRecord = {
          _id: createdRecord._id,
          date: formData.date,
          type: formData.type,
          amount: parseFloat(formData.amount),
          gasStation: formData.type === 'fuelConsumption' ? formData.gasStation : '',
          vehiclePlateNumber: formData.type === 'fuelConsumption' ? vehiclePlateNumber : 'N/A',
          vehicleId: formData.type === 'fuelConsumption' ? formData.vehicle : null,
          city: cityName,
          cityId: formData.cityId,
          assistantName: user.name,
          assistantId: user._id,
          notes: formData.notes,
          receiptImage: createdRecord.receiptImage || null
        };
        
        setFuelRecords([newRecord, ...fuelRecords]);
        setShowAddModal(false);
        
        setFormData({
          date: new Date().toISOString().split('T')[0],
          type: 'cardLoad',
          amount: '',
          gasStation: '',
          vehicle: '',
          notes: '',
          cityId: ''
        });
        
        alert('Înregistrarea a fost adăugată cu succes!');
        
        // Reîncărcăm statisticile
        fetchFuelStats();
      } else {
        alert('Eroare la adăugarea înregistrării. Verificați datele și reîncercați.');
      }
    } catch (err) {
      console.error('Eroare la adăugare:', err);
      alert(`Eroare: ${err.response?.data?.message || 'Nu s-a putut adăuga înregistrarea'}`);
    }
  };
  
  const getTypeStyle = (type) => {
    if (type === 'cardLoad') {
      return { icon: faCreditCard, color: 'success', label: 'Încărcare card' };
    } else {
      return { icon: faGasPump, color: 'danger', label: 'Consum carburant' };
    }
  };
  
  const renderStats = () => (
    <div className="content-card mb-4">
      <h5 className="mb-3">
        <FontAwesomeIcon icon={faCoins} className="me-2" />
        Buget Carburant
      </h5>
      <div className="row">
        <div className="col-md-4">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">Total Încărcat</h6>
                  <h3 className="mt-2 mb-0">{formatAmount(fuelStats.cardLoad.totalAmount)}</h3>
                 <small>({fuelStats.cardLoad.count} tranzacții)</small>
               </div>
               <FontAwesomeIcon icon={faCreditCard} size="2x" />
             </div>
           </div>
         </div>
       </div>
       <div className="col-md-4">
         <div className="card bg-danger text-white">
           <div className="card-body">
             <div className="d-flex justify-content-between align-items-center">
               <div>
                 <h6 className="mb-0">Total Consumat</h6>
                 <h3 className="mt-2 mb-0">{formatAmount(fuelStats.fuelConsumption.totalAmount)}</h3>
                 <small>({fuelStats.fuelConsumption.count} tranzacții)</small>
               </div>
               <FontAwesomeIcon icon={faGasPump} size="2x" />
             </div>
           </div>
         </div>
       </div>
       <div className="col-md-4">
         <div className={`card ${fuelStats.remainingBudget >= 0 ? 'bg-primary' : 'bg-warning'} text-white`}>
           <div className="card-body">
             <div className="d-flex justify-content-between align-items-center">
               <div>
                 <h6 className="mb-0">Buget Rămas</h6>
                 <h3 className="mt-2 mb-0">{formatAmount(fuelStats.remainingBudget)}</h3>
                 <small>&nbsp;</small>
               </div>
               <FontAwesomeIcon icon={faMoneyBillWave} size="2x" />
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
             placeholder="Număr mașină, stație..."
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
             <FontAwesomeIcon icon={faGasPump} className="me-2" />
             Tip
           </label>
           <select 
             className="form-select"
             value={typeFilter}
             onChange={(e) => setTypeFilter(e.target.value)}
           >
             <option value="">Toate tipurile</option>
             <option value="cardLoad">Încărcare card</option>
             <option value="fuelConsumption">Consum carburant</option>
           </select>
         </div>
       </div>

       <div className="col-md-2">
         <div className="form-group">
           <label className="form-label">
             <FontAwesomeIcon icon={faCar} className="me-2" />
             Vehicul
           </label>
           <select 
             className="form-select"
             value={vehicleFilter}
             onChange={(e) => setVehicleFilter(e.target.value)}
           >
             <option value="">Toate vehiculele</option>
             {vehicles.map(vehicle => (
               <option key={vehicle._id} value={vehicle._id}>{vehicle.plateNumber}</option>
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
               setTypeFilter('');
               setVehicleFilter('');
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
               fetchFuelRecords();
               fetchFuelStats();
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
             Adaugă tranzacție
           </button>
         </div>
       </div>
     </div>
   </div>
 );
 
 const renderRecordsTable = () => (
   <div className="content-card">
     <h5 className="mb-4">
       <FontAwesomeIcon icon={faGasPump} className="me-2" />
       Tranzacții Carburant ({filteredRecords.length})
     </h5>
     
     <div className="table-responsive">
       <table className="table table-hover booking-table">
         <thead>
           <tr>
             <th>Data</th>
             <th>Tip</th>
             <th>Sumă</th>
             <th>Vehicul</th>
             <th>Stație</th>
             <th>Bon</th>
             {isAdmin && <th>Asistent</th>}
             <th>Acțiuni</th>
           </tr>
         </thead>
         <tbody>
           {filteredRecords.map(record => {
             const typeStyle = getTypeStyle(record.type);
             const hasReceipt = !!record.receiptImage;
             
             return (
               <tr key={record._id}>
                 <td>
                   <div>
                     <FontAwesomeIcon icon={faCalendarAlt} className="me-1 text-muted" />
                     {formatDate(record.date)}
                   </div>
                 </td>
                 <td>
                   <div className={`badge rounded-pill text-bg-${typeStyle.color}`}>
                     <FontAwesomeIcon icon={typeStyle.icon} className="me-1" />
                     {typeStyle.label}
                   </div>
                 </td>
                 <td>
                   <div className="fw-bold">{formatAmount(record.amount)}</div>
                 </td>
                 <td>
                   {record.type === 'fuelConsumption' ? (
                     <div>
                       <FontAwesomeIcon icon={faCar} className="me-1 text-muted" />
                       {record.vehiclePlateNumber}
                     </div>
                   ) : (
                     <span className="text-muted">-</span>
                   )}
                 </td>
                 <td>
                   {record.type === 'fuelConsumption' && record.gasStation ? (
                     <div>{record.gasStation}</div>
                   ) : (
                     <span className="text-muted">-</span>
                   )}
                 </td>
                 <td>
                   {hasReceipt ? (
                     <Badge bg="info" pill>
                       <FontAwesomeIcon icon={faReceipt} className="me-1" />
                       Da
                     </Badge>
                   ) : (
                     <span className="text-muted small">Fără bon</span>
                   )}
                 </td>
                 {isAdmin && (
                   <td>
                     <div className="d-flex align-items-center">
                       <div className="me-2 assistant-avatar">
                         <FontAwesomeIcon icon={faUserNurse} size="xs" />
                       </div>
                       <div>
                         {record.assistantName}
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
                     
                     {(isAdmin || record.assistantId === user._id) && (
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
             );
           })}
         </tbody>
       </table>
     </div>
     
     {filteredRecords.length === 0 && !loading && (
       <div className="text-center py-4">
         <p className="text-muted">Nu există tranzacții de carburant înregistrate.</p>
         <button 
           className="btn btn-success mt-3"
           onClick={handleAddNewRecord}
         >
           <FontAwesomeIcon icon={faPlus} className="me-2" />
           Adaugă prima tranzacție
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
         Adaugă Tranzacție Carburant
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
                 <Form.Label>Tip tranzacție *</Form.Label>
                 <Form.Select
                   name="type"
                   value={formData.type}
                   onChange={handleInputChange}
                   required
                 >
                   {fuelTypes.map(type => (
                     <option key={type.value} value={type.value}>
                       {type.label}
                     </option>
                   ))}
                 </Form.Select>
               </Form.Group>
             </div>
           </div>
           
           <div className="row mb-3">
             <div className="col-md-6">
               <Form.Group className="mb-3">
                 <Form.Label>
                   <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                   Sumă (RON) *
                 </Form.Label>
                 <Form.Control 
                   type="number" 
                   step="0.01"
                   min="0"
                   name="amount"
                   value={formData.amount}
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
           
           {formData.type === 'fuelConsumption' && (
             <div className="row mb-3">
               <div className="col-md-6">
                 <Form.Group className="mb-3">
                   <Form.Label>
                     <FontAwesomeIcon icon={faCar} className="me-2" />
                     Vehicul *
                   </Form.Label>
                   {vehicles.length > 0 ? (
                     <Form.Select
                       name="vehicle"
                       value={formData.vehicle}
                       onChange={handleInputChange}
                       required={formData.type === 'fuelConsumption'}
                     >
                       <option value="">Selectați un vehicul</option>
                       {vehicles.map(vehicle => (
                         <option key={vehicle._id} value={vehicle._id}>
                           {vehicle.plateNumber} ({vehicle.city})
                         </option>
                       ))}
                     </Form.Select>
                   ) : (
                     <div className="alert alert-warning">
                       Nu s-au găsit vehicule disponibile.
                     </div>
                   )}
                 </Form.Group>
               </div>
               <div className="col-md-6">
                 <Form.Group className="mb-3">
                   <Form.Label>
                     <FontAwesomeIcon icon={faGasPump} className="me-2" />
                     Stație carburant *
                   </Form.Label>
                   <Form.Control 
                     type="text" 
                     name="gasStation"
                     value={formData.gasStation}
                     onChange={handleInputChange}
                     required={formData.type === 'fuelConsumption'}
                     placeholder="Ex: OMV, Petrom, etc."
                   />
                 </Form.Group>
               </div>
             </div>
           )}
           
           <Form.Group className="mb-3">
             <Form.Label>Note suplimentare</Form.Label>
             <Form.Control 
               as="textarea" 
               rows={3}
               name="notes"
               value={formData.notes}
               onChange={handleInputChange}
             />
           </Form.Group>
           
           {/* Secțiune pentru încărcarea bonului */}
           <div className="document-upload-section mt-4">
             <h5 className="mb-3">
               <FontAwesomeIcon icon={faReceipt} className="me-2" />
               Bon fiscal
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
                   className="me-3"
                   onClick={() => document.getElementById('add-receipt-camera').click()}
                 >
                   <FontAwesomeIcon icon={faCamera} className="me-2" />
                   Fă o poză
                 </Button>
                 
                 {/* Input pentru bon (inclusiv imagini) */}
                 <input
                   type="file"
                   id="add-receipt-file"
                   style={{ display: 'none' }}
                   onChange={handleFileChange}
                   accept="image/*,application/pdf"
                 />
                 
                 {/* Input pentru camera */}
                 <input
                   type="file"
                   id="add-receipt-camera"
                   style={{ display: 'none' }}
                   onChange={handleFileChange}
                   accept="image/*"
                   capture="environment"
                 />
               </div>
             </div>
             
             {selectedFile && (
               <div className="selected-file-info mb-3">
                 <div className="d-flex justify-content-between align-items-center">
                   <div>
                     <FontAwesomeIcon icon={getFileIcon(selectedFile.type)} className="me-2" />
                     <span>{selectedFile.name}</span> 
                     <span className="text-muted ms-2">({formatFileSize(selectedFile.size)})</span>
                   </div>
                   <Button 
                     variant="outline-danger" 
                     size="sm"
                     onClick={() => setSelectedFile(null)}
                   >
                     <FontAwesomeIcon icon={faTrash} />
                   </Button>
                 </div>
 
                 {isUploading && (
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
         Salvează tranzacție
       </Button>
     </Modal.Footer>
   </Modal>
 );
 
 const renderEditRecordModal = () => (
   <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered className="booking-modal">
     <Modal.Header closeButton>
       <Modal.Title>
         <FontAwesomeIcon icon={faPen} className="me-2" />
         Editează Tranzacție
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
                 <Form.Label>Tip tranzacție *</Form.Label>
                 <Form.Select
                   name="type"
                   value={formData.type}
                   onChange={handleInputChange}
                   required
                 >
                   {fuelTypes.map(type => (
                     <option key={type.value} value={type.value}>
                       {type.label}
                     </option>
                   ))}
                 </Form.Select>
               </Form.Group>
             </div>
           </div>
           
           <div className="row mb-3">
             <div className="col-md-6">
               <Form.Group className="mb-3">
                 <Form.Label>
                   <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                   Sumă (RON) *
                 </Form.Label>
                 <Form.Control 
                   type="number" 
                   step="0.01"
                   min="0"
                   name="amount"
                   value={formData.amount}
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
           
           {formData.type === 'fuelConsumption' && (
             <div className="row mb-3">
               <div className="col-md-6">
                 <Form.Group className="mb-3">
                   <Form.Label>
                     <FontAwesomeIcon icon={faCar} className="me-2" />
                     Vehicul *
                   </Form.Label>
                   {vehicles.length > 0 ? (
                     <Form.Select
                       name="vehicle"
                       value={formData.vehicle}
                       onChange={handleInputChange}
                       required={formData.type === 'fuelConsumption'}
                     >
                       <option value="">Selectați un vehicul</option>
                       {vehicles.map(vehicle => (
                         <option key={vehicle._id} value={vehicle._id}>
                           {vehicle.plateNumber} ({vehicle.city})
                         </option>
                       ))}
                     </Form.Select>
                   ) : (
                     <div className="alert alert-warning">
                       Nu s-au găsit vehicule disponibile.
                     </div>
                   )}
                 </Form.Group>
               </div>
               <div className="col-md-6">
                 <Form.Group className="mb-3">
                   <Form.Label>
                     <FontAwesomeIcon icon={faGasPump} className="me-2" />
                     Stație carburant *
                   </Form.Label>
                   <Form.Control 
                     type="text" 
                     name="gasStation"
                     value={formData.gasStation}
                     onChange={handleInputChange}
                     required={formData.type === 'fuelConsumption'}
                     placeholder="Ex: OMV, Petrom, etc."
                   />
                 </Form.Group>
               </div>
             </div>
           )}
           
           <Form.Group className="mb-3">
             <Form.Label>Note suplimentare</Form.Label>
             <Form.Control 
               as="textarea" 
               rows={3}
               name="notes"
               value={formData.notes}
               onChange={handleInputChange}
             />
           </Form.Group>
           
           <div className="alert alert-info">
             <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
             Bonul fiscal poate fi gestionat din vizualizarea detaliată a tranzacției.
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
 
 const renderViewRecordModal = () => (
   <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered className="booking-modal">
     <Modal.Header closeButton>
       <Modal.Title>Detalii Tranzacție</Modal.Title>
     </Modal.Header>
     <Modal.Body>
       {currentRecord && (
         <div className="record-details">
           <div className="mb-4">
             <h5 className="mb-3">Informații Tranzacție</h5>
             <p>
               <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
               <strong>Data:</strong> {formatDate(currentRecord.date)}
             </p>
             <p>
               <FontAwesomeIcon 
                 icon={getTypeStyle(currentRecord.type).icon} 
                 className={`me-2 text-${getTypeStyle(currentRecord.type).color}`} 
               />
               <strong>Tip:</strong> {getTypeStyle(currentRecord.type).label}
             </p>
             <p>
               <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
               <strong>Sumă:</strong> {formatAmount(currentRecord.amount)}
             </p>
             {currentRecord.type === 'fuelConsumption' && (
               <>
                 <p>
                   <FontAwesomeIcon icon={faCar} className="me-2" />
                   <strong>Vehicul:</strong> {currentRecord.vehiclePlateNumber}
                 </p>
                 <p>
                   <FontAwesomeIcon icon={faGasPump} className="me-2" />
                   <strong>Stație carburant:</strong> {currentRecord.gasStation || 'N/A'}
                 </p>
               </>
             )}
             <p>
               <FontAwesomeIcon icon={faCity} className="me-2" />
               <strong>Oraș:</strong> {currentRecord.city}
             </p>
             <p>
               <FontAwesomeIcon icon={faUserNurse} className="me-2" />
               <strong>Asistent:</strong> {currentRecord.assistantName}
             </p>
             {currentRecord.notes && (
               <div className="mt-3">
                 <p><strong>Note:</strong></p>
                 <p>{currentRecord.notes}</p>
               </div>
             )}
           </div>
           
           <div className="mb-4">
             <h5 className="d-flex justify-content-between align-items-center mb-3">
               <span>Bon Fiscal</span>
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
               onChange={handleFileChange}
               accept="image/*,application/pdf"
             />
             
             <input
               type="file"
               id="receipt-camera"
               style={{ display: 'none' }}
               onChange={handleFileChange}
               accept="image/*"
               capture="environment"
             />
             
             {selectedFile && (
               <div className="selected-file-info mb-3">
                 <div className="d-flex justify-content-between align-items-center">
                   <div>
                   <FontAwesomeIcon icon={getFileIcon(selectedFile.type)} className="me-2" />
                     <span>{selectedFile.name}</span> 
                     <span className="text-muted ms-2">({formatFileSize(selectedFile.size)})</span>
                   </div>
                   <div>
                     <Button 
                       variant="primary" 
                       size="sm"
                       className="me-2"
                       onClick={() => handleUploadReceipt(currentRecord._id)}
                       disabled={isUploading}
                     >
                       {isUploading ? 'Se încarcă...' : 'Încarcă'}
                     </Button>
                     <Button 
                       variant="outline-danger" 
                       size="sm"
                       onClick={() => setSelectedFile(null)}
                     >
                       <FontAwesomeIcon icon={faTrash} />
                     </Button>
                   </div>
                 </div>
 
                 {isUploading && (
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
               <div className="receipt-container">
                 <div className="d-flex justify-content-between align-items-center mb-2">
                   <h6 className="mb-0">Bon atașat:</h6>
                   <div>
                     <Button 
                       variant="outline-primary" 
                       size="sm" 
                       className="me-2"
                       onClick={() => handleDownloadReceipt(currentRecord._id)}
                     >
                       <FontAwesomeIcon icon={faDownload} className="me-1" />
                       Descarcă
                     </Button>
                   </div>
                 </div>
                 <div className="receipt-preview border rounded p-2">
                   <img 
                     src={`/uploads/${currentRecord.receiptImage.replace(/^uploads\//, '')}`} 
                     alt="Bon fiscal" 
                     className="img-fluid" 
                     style={{ maxHeight: '300px', display: 'block', margin: '0 auto' }}
                   />
                 </div>
               </div>
             ) : (
               <div className="text-center py-3 border rounded">
                 <p className="text-muted mb-0">
                   <FontAwesomeIcon icon={faReceipt} className="me-2" />
                   Nu există bon atașat. Încărcați un bon pentru această tranzacție.
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
         <p>
           Sunteți sigur că doriți să ștergeți tranzacția de tip <strong>{getTypeStyle(recordToDelete.type).label}</strong> din data <strong>{formatDate(recordToDelete.date)}</strong>, cu suma <strong>{formatAmount(recordToDelete.amount)}</strong>?
           {recordToDelete.receiptImage && (
             <span className="text-danger d-block mt-2">
               <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
               Această tranzacție are un bon atașat care va fi șters permanent.
             </span>
           )}
         </p>
       )}
     </Modal.Body>
     <Modal.Footer>
       <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
         Anulează
       </Button>
       <Button variant="danger" onClick={handleDeleteConfirm}>
         <FontAwesomeIcon icon={faTrash} className="me-1" />
         Șterge tranzacție
       </Button>
     </Modal.Footer>
   </Modal>
 );
 
 // Adăugăm stilizare CSS pentru funcționalitățile noi
 const customStyles = `
   .receipt-container {
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
           <FontAwesomeIcon icon={faGasPump} className="me-2" />
           Gestionare Carburant
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
       {renderDeleteConfirmModal()}
     </div>
   </Layout>
 );
};

export default Fuel;