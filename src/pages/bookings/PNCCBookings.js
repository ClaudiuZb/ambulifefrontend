import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faAmbulance, 
  faUser, 
  faPhone, 
  faMapMarkerAlt, 
  faCalendarAlt,
  faSearch,
  faFilter,
  faEye,
  faSortAmountDown,
  faSync,
  faPlus,
  faPen,
  faTrash,
  faArrowRight,
  faCity,
  faCheckCircle,
  faSpinner,
  faClock,
  faUserNurse,
  faUsers,
  faBuilding,
  faFileUpload,
  faFilePdf,
  faFileImage,
  faFileWord,
  faFileExcel,
  faFile,
  faDownload,
  faCamera,
  faPaperclip,
  faInfoCircle,
  faCalendarWeek,
  faListOl
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import { Modal, Button, Form, Badge, ProgressBar } from 'react-bootstrap';

const PNCCBookings = () => {
  const { user } = useSelector(state => state.auth);
  const isAdmin = user && user.role === 'admin';
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [brigadeMembers, setBrigadeMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [bookingToUpdateStatus, setBookingToUpdateStatus] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState(null);
  
  // State pentru încărcarea documentelor
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [showDocumentDeleteConfirm, setShowDocumentDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    patientName: '',
    pickupLocation: '',
    destinationLocation: '',
    startDate: new Date().toISOString().split('T')[0],
    procedureCount: 1,
    notes: '',
    status: 'Urmează',
    cityId: '',
    brigadeEmployeeId: ''
  });

  const statusOptions = [
    { value: 'Finalizat', icon: faCheckCircle, color: 'success' },
    { value: 'Urmează', icon: faClock, color: 'primary' },
    { value: 'Anulat', icon: faTrash, color: 'danger' }
  ];
  
  useEffect(() => {
    if (user) {
      console.log('Informații detaliate utilizator:', {
        id: user._id,
        name: user.name,
        role: user.role,
        city: user.city,
        type: typeof user.city,
        cityId: typeof user.city === 'object' ? user.city._id : user.city
      });
    }
  }, [user]);
  
  const fetchBookings = async () => {
    setLoading(true);
    try {
      console.log('Utilizator curent la fetchBookings:', user.name, user._id);
      console.log('Încărcăm programările cu membrii brigăzii:', brigadeMembers);
      
      const response = await axios.get('/api/pncc-services');
      
      console.log('Răspuns API programări PNCC:', response.data);
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        const bookingsData = await Promise.all(response.data.data.map(async service => {
          // Extragem informațiile despre pacient
          const patientName = service.patientName || 'Pacient necunoscut';
          
          // Formatăm data de început
          const startDate = new Date(service.startDate).toISOString().split('T')[0];
          
          // Extragem numele și ID-ul orașului
          let cityName = 'Necunoscut';
          let cityId = null;
          
          if (service.city) {
            if (typeof service.city === 'object') {
              cityName = service.city.name || 'Necunoscut';
              cityId = service.city._id;
            } else if (typeof service.city === 'string') {
              cityId = service.city;
              if (cityId === '6823053af3c9fed99da59f39') {
                cityName = 'Suceava';
              } else if (cityId === '6823053af3c9fed99da59f3a') {
                cityName = 'Botoșani';
              }
            }
          }
          
          // Extragem numele asistentului
          let assistantName = 'Nealocat';
          let assistantId = null;
          
          console.log(`Service ${service._id} are asistent:`, service.assistant);
          
          if (service.assistant) {
            if (typeof service.assistant === 'object') {
              assistantName = service.assistant.name || 'Nealocat';
              assistantId = service.assistant._id;
              console.log(`Asistent object: ${assistantName} (${assistantId})`);
            } else if (typeof service.assistant === 'string') {
              assistantId = service.assistant;
              
              if (assistantId === user._id) {
                assistantName = user.name;
                console.log(`Asistentul este utilizatorul curent: ${assistantName}`);
              } else {
                const foundMember = brigadeMembers.find(m => m._id === assistantId);
                if (foundMember) {
                  assistantName = foundMember.name;
                  console.log(`Asistent găsit în brigadeMembers: ${assistantName} (${assistantId})`);
                } else {
                  console.log(`Nu s-a găsit asistentul cu ID ${assistantId} în brigadeMembers:`, brigadeMembers);
                  
                  try {
                    const userResponse = await axios.get(`/api/users/${assistantId}`);
                    if (userResponse.data && userResponse.data.data) {
                      assistantName = userResponse.data.data.name || 'Asistent';
                      console.log(`Asistent găsit prin request separat: ${assistantName}`);
                    }
                  } catch (error) {
                    console.error(`Nu s-a putut obține asistentul cu ID ${assistantId}:`, error);
                  }
                }
              }
            }
          } else {
            console.log(`Service ${service._id} nu are asistent asociat`);
          }
          
          // Procesăm documentele
          const documents = service.documents || [];
          
          return {
            _id: service._id,
            patientName,
            pickupLocation: service.pickupPoint,
            destinationLocation: service.dropoffPoint,
            startDate,
            procedureCount: service.procedureCount,
            city: cityName,
            cityId,
            assistantName,
            assistantId,
            status: mapBackendStatus(service.status),
            notes: service.notes,
            documents,
          };
        }));
        
        console.log('Date programări PNCC procesate:', bookingsData);
        
        const forcedBookingsData = bookingsData.map(booking => {
          if (booking.assistantId === user._id) {
            return {
              ...booking,
              assistantName: user.name
            };
          }
          return booking;
        });
        
        const userCityId = user.city && typeof user.city === 'object' 
          ? user.city._id 
          : typeof user.city === 'string' 
            ? user.city 
            : null;
            
        const filteredBookings = isAdmin 
          ? forcedBookingsData 
          : forcedBookingsData.filter(booking => booking.cityId === userCityId);
        
        setBookings(filteredBookings);
      } else {
        console.warn('Nu s-au găsit programări în răspunsul API-ului sau formatul datelor este incorect.');
        setBookings([]);
      }
      
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Eroare la încărcarea programărilor PNCC:', err);
      setError(err.response?.data?.message || 'Nu s-au putut obține programările. Vă rugăm să reîncercați mai târziu.');
      setLoading(false);
      setBookings([]);
    }
  };
  
  const mapBackendStatus = (backendStatus) => {
    const statusMap = {
      'pending': 'Urmează',
      'completed': 'Finalizat', 
      'cancelled': 'Anulat'
    };
    
    return statusMap[backendStatus] || 'Urmează';
  };
  
  const mapFrontendStatus = (frontendStatus) => {
    const statusMap = {
      'Urmează': 'pending',
      'Finalizat': 'completed',
      'Anulat': 'cancelled'
    };
    
    return statusMap[frontendStatus] || 'pending';
  };
  
  useEffect(() => {
    if (user) {
      fetchBrigadeMembers();
      fetchCities();
    }
  }, [user]);
  
  useEffect(() => {
    if (user && brigadeMembers.length > 0) {
      fetchBookings();
    }
  }, [user, brigadeMembers]);
  
  useEffect(() => {
    if (!isAdmin && (!user || !user._id)) {
      console.warn("Atenție: Utilizatorul curent nu are un ID valid!", user);
    }
  }, [user, isAdmin]);
  
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
  
  const fetchBrigadeMembers = async () => {
    setLoadingMembers(true);
    try {
      const response = await axios.get('/api/users');
      
      if (response.data && response.data.data) {
        const allUsers = response.data.data;
        const assistantUsers = allUsers.filter(user => user.role === 'assistant');
        
        const members = assistantUsers.map(user => ({
          _id: user._id,
          name: user.name,
          city: user.city && typeof user.city === 'object' && user.city.name 
            ? user.city.name 
            : typeof user.city === 'string' 
              ? (user.city === '6823053af3c9fed99da59f39' ? 'Suceava' : 
                 user.city === '6823053af3c9fed99da59f3a' ? 'Botoșani' : 'Oraș necunoscut')
              : 'Oraș necunoscut',
          cityId: user.city && typeof user.city === 'object' && user.city._id 
            ? user.city._id 
            : typeof user.city === 'string' 
              ? user.city 
              : null
        }));
        
        console.log('Membri brigada obținuți (filtrați din toți utilizatorii):', members);
        
        const userCityId = user.city && typeof user.city === 'object' 
          ? user.city._id 
          : typeof user.city === 'string' 
            ? user.city 
            : null;
        
        const filteredMembers = isAdmin 
          ? members 
          : members.filter(member => member.cityId === userCityId);
        
        setBrigadeMembers(filteredMembers);
      } else {
        console.warn('Nu s-au găsit utilizatori în răspunsul API-ului.');
        setBrigadeMembers([]);
      }
      
      setLoadingMembers(false);
    } catch (err) {
      console.error('Eroare la încărcarea membrilor brigăzii:', err);
      
      const hardcodedMembers = [
        {
          _id: '6823058e27708a015183058c',
          name: 'Claudiu', 
          city: 'Suceava',
          cityId: '6823053af3c9fed99da59f39'
        }
      ];
      
      const filteredMembers = isAdmin 
        ? hardcodedMembers 
        : hardcodedMembers.filter(member => {
            const userCityId = user.city && typeof user.city === 'object' 
              ? user.city._id 
              : typeof user.city === 'string' 
                ? user.city
                : null;
                
            return member.cityId === userCityId;
          });
      
      setBrigadeMembers(filteredMembers);
      setLoadingMembers(false);
      console.warn('Eroare la încărcarea membrilor brigăzii. Se folosesc date temporare pentru dezvoltare.');
    }
  };
  
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      searchTerm === '' || 
      booking.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.destinationLocation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = cityFilter === '' || booking.city === cityFilter;
    
    const matchesDate = dateFilter === '' || 
      booking.startDate === dateFilter;
    
    const matchesStatus = statusFilter === '' || booking.status === statusFilter;
    
    return matchesSearch && matchesCity && matchesDate && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return sortOrder === 'asc' 
        ? dateA - dateB 
        : dateB - dateA;
    } else if (sortBy === 'patientName') {
      return sortOrder === 'asc'
        ? a.patientName.localeCompare(b.patientName)
        : b.patientName.localeCompare(a.patientName);
    } else if (sortBy === 'procedureCount') {
      return sortOrder === 'asc'
        ? a.procedureCount - b.procedureCount
        : b.procedureCount - a.procedureCount;
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
    if (mimetype.includes('pdf')) return faFilePdf;
    if (mimetype.includes('image')) return faFileImage;
    if (mimetype.includes('word')) return faFileWord;
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return faFileExcel;
    return faFile;
  };
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };
  
  const handleUploadDocument = async (bookingId) => {
    if (!selectedFile) {
      alert('Vă rugăm să selectați un fișier');
      return;
    }
    
    const formData = new FormData();
    formData.append('document', selectedFile);
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const response = await axios.post(
        `/api/pncc-services/${bookingId}/documents`,
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
      
      if (response.data && response.data.success && response.data.data) {
        setSelectedFile(null);
        alert('Documentul a fost încărcat cu succes!');
        
        // Reîncarcă programarea pentru a obține documentele actualizate cu ID-uri valide
        try {
          const bookingResponse = await axios.get(`/api/pncc-services/${bookingId}`);
          
          if (bookingResponse.data && bookingResponse.data.success) {
            const updatedBooking = bookingResponse.data.data;
            
            // Procesează orașul
            let cityName = 'Necunoscut';
            let cityId = null;
            
            if (updatedBooking.city) {
              if (typeof updatedBooking.city === 'object') {
                cityName = updatedBooking.city.name || 'Necunoscut';
                cityId = updatedBooking.city._id;
              } else if (typeof updatedBooking.city === 'string') {
                cityId = updatedBooking.city;
                if (cityId === '6823053af3c9fed99da59f39') {
                  cityName = 'Suceava';
                } else if (cityId === '6823053af3c9fed99da59f3a') {
                  cityName = 'Botoșani';
                }
              }
            }
            
            // Procesează asistentul
            let assistantName = 'Nealocat';
            let assistantId = null;
            
            if (updatedBooking.assistant) {
              if (typeof updatedBooking.assistant === 'object') {
                assistantName = updatedBooking.assistant.name || 'Nealocat';
                assistantId = updatedBooking.assistant._id;
              } else if (typeof updatedBooking.assistant === 'string') {
                assistantId = updatedBooking.assistant;
                
                const foundMember = brigadeMembers.find(m => m._id === assistantId);
                if (foundMember) {
                  assistantName = foundMember.name;
                }
              }
            }
            
            // Formatarea datei
            const startDate = new Date(updatedBooking.startDate).toISOString().split('T')[0];
            
            // Creăm obiectul formatat pentru afișare
            const formattedBooking = {
              _id: updatedBooking._id,
              patientName: updatedBooking.patientName,
              pickupLocation: updatedBooking.pickupPoint,
              destinationLocation: updatedBooking.dropoffPoint,
              startDate,
              procedureCount: updatedBooking.procedureCount,
              city: cityName,
              cityId,
              assistantName,
              assistantId,
              status: mapBackendStatus(updatedBooking.status),
              notes: updatedBooking.notes,
              documents: updatedBooking.documents || []
            };
            
            // Actualizăm booking-ul curent dacă este cel care se afișează
            if (currentBooking && currentBooking._id === bookingId) {
              setCurrentBooking(formattedBooking);
            }
            
            // Actualizăm și lista generală de programări
            setBookings(prevBookings => 
              prevBookings.map(b => 
                b._id === bookingId ? formattedBooking : b
              )
            );
          }
        } catch (fetchErr) {
          console.error('Eroare la reîncărcarea programării după încărcare document:', fetchErr);
        }
      }
    } catch (err) {
      console.error('Eroare la încărcarea documentului:', err);
      alert(`Eroare: ${err.response?.data?.message || 'Nu s-a putut încărca documentul'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  const handleDeleteDocumentInit = (bookingId, documentId) => {
    setDocumentToDelete({ bookingId, documentId });
    setShowDocumentDeleteConfirm(true);
  };
  
  const handleDeleteDocumentConfirm = async () => {
    try {
      const { bookingId, documentId } = documentToDelete;
      
      await axios.delete(`/api/pncc-services/${bookingId}/documents/${documentId}`);
      
      // Actualizăm lista de documente pentru booking-ul curent
      if (currentBooking && currentBooking._id === bookingId) {
        setCurrentBooking({
          ...currentBooking,
          documents: currentBooking.documents.filter(doc => doc._id !== documentId)
        });
      }
      
      // Actualizăm și lista generală
      setBookings(prevBookings => 
        prevBookings.map(b => {
          if (b._id === bookingId) {
            return {
              ...b,
              documents: (b.documents || []).filter(doc => doc._id !== documentId)
            };
          }
          return b;
        })
      );
      
      setShowDocumentDeleteConfirm(false);
      setDocumentToDelete(null);
      
      alert('Documentul a fost șters cu succes!');
    } catch (err) {
      console.error('Eroare la ștergerea documentului:', err);
      alert(`Eroare: ${err.response?.data?.message || 'Nu s-a putut șterge documentul'}`);
      setShowDocumentDeleteConfirm(false);
    }
  };
  
  const handleDownloadDocument = async (bookingId, documentId, documentName) => {
    try {
      // Verifică dacă documentId este valid
      if (!documentId) {
        console.error('ID document invalid:', documentId);
        alert('ID document invalid. Nu se poate descărca documentul.');
        return;
      }
      
      console.log('Descărcare document:', { bookingId, documentId, documentName });
      
      const response = await axios.get(`/api/pncc-services/${bookingId}/documents/${documentId}/download`, {
        responseType: 'blob'
      });
      
      // Creăm un URL pentru blob și descărcăm fișierul
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', documentName || 'document');
      document.body.appendChild(link);
      link.click();
      
      // Curat elementul și eliberez URL-ul
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Eroare la descărcarea documentului:', err);
      alert(`Eroare: ${err.response?.data?.message || 'Nu s-a putut descărca documentul'}`);
    }
  };
  
  const handleViewBooking = (booking) => {
    setCurrentBooking(booking);
    setShowViewModal(true);
  };
  
  const handleAddNewBooking = () => {
    const initialFormData = {
      patientName: '',
      pickupLocation: '',
      destinationLocation: '',
      startDate: new Date().toISOString().split('T')[0],
      procedureCount: 1,
      notes: '',
      status: 'Urmează',
      brigadeEmployeeId: '',
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
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleEditInit = (booking) => {
    // Populăm formularul cu datele cursei existente
    setFormData({
      patientName: booking.patientName,
      pickupLocation: booking.pickupLocation,
      destinationLocation: booking.destinationLocation,
      startDate: booking.startDate,
      procedureCount: booking.procedureCount,
      notes: booking.notes,
      status: booking.status,
      cityId: booking.cityId,
      brigadeEmployeeId: booking.assistantId || ''
    });
    
    setBookingToEdit(booking);
    setShowEditModal(true);
  };
  
  const handleDeleteInit = (booking) => {
    setBookingToDelete(booking);
    setShowDeleteConfirm(true);
  };
  
  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/pncc-services/${bookingToDelete._id}`);
      
      setBookings(bookings.filter(b => b._id !== bookingToDelete._id));
      
      setShowDeleteConfirm(false);
      setBookingToDelete(null);
      
      alert('Programarea a fost ștearsă cu succes');
    } catch (err) {
      console.error('Eroare la ștergere:', err);
      alert(`Eroare: ${err.response?.data?.message || 'Nu s-a putut șterge programarea'}`);
      setShowDeleteConfirm(false);
    }
  };
  
  const handleStatusInit = (booking) => {
    const initialBrigadeEmployeeId = !isAdmin ? user._id : '';
  
    console.log("Inițializare modal status:", { 
      booking, 
      userId: user._id, 
      isAdmin, 
      initialBrigadeEmployeeId 
    });
    
    setFormData({
      ...formData,
      brigadeEmployeeId: initialBrigadeEmployeeId
    });
    
    setBookingToUpdateStatus(booking);
    setShowStatusModal(true);
  };
  
  const handleStatusUpdate = async (newStatus) => {
    try {
      const backendStatus = mapFrontendStatus(newStatus);
      
      const updateData = {
        status: backendStatus
      };
      
      if (newStatus === 'Finalizat' && !isAdmin) {
        updateData.assistant = user._id;
        console.log(`Asistent finalizează cursa: setăm ID-ul asistentului ${user.name} (${user._id})`);
      } else if (newStatus === 'Finalizat' && isAdmin) {
        if (!formData.brigadeEmployeeId) {
          alert('Vă rugăm să selectați un membru al brigăzii care a finalizat cursa!');
          return;
        }
        updateData.assistant = formData.brigadeEmployeeId;
      }
      
      console.log(`Datele trimise pentru actualizare status:`, updateData);
      
      const response = await axios.put(`/api/pncc-services/${bookingToUpdateStatus._id}`, updateData);
      
      console.log(`Răspuns API actualizare:`, response.data);
      
      if (response.data && response.data.success) {
        let updatedAssistantName = bookingToUpdateStatus.assistantName;
        let updatedAssistantId = bookingToUpdateStatus.assistantId;
        
        if (newStatus === 'Finalizat') {
          if (!isAdmin) {
            updatedAssistantName = user.name;
            updatedAssistantId = user._id;
            console.log(`Setăm numele asistentului în UI la: ${updatedAssistantName}`);
          } else if (formData.brigadeEmployeeId) {
            const selectedEmployee = brigadeMembers.find(m => m._id === formData.brigadeEmployeeId);
            updatedAssistantName = selectedEmployee ? selectedEmployee.name : 'Necunoscut';
            updatedAssistantId = formData.brigadeEmployeeId;
          }
        }
        
        const updatedBooking = {
          ...bookingToUpdateStatus,
          status: newStatus,
          assistantName: updatedAssistantName,
          assistantId: updatedAssistantId
        };
        
        setBookings(prevBookings => 
          prevBookings.map(b => 
            b._id === bookingToUpdateStatus._id ? updatedBooking : b
          )
        );
        
        setFormData({
          ...formData,
          brigadeEmployeeId: ''
        });
        
        setShowStatusModal(false);
        setBookingToUpdateStatus(null);
        
        alert(`Statusul a fost actualizat la: ${newStatus}`);
        
        setTimeout(async () => {
          await fetchBrigadeMembers();
          await fetchBookings();
        }, 1000);
      } else {
        alert('Eroare la actualizarea statusului. Verificați datele și reîncercați.');
      }
    } catch (err) {
      console.error('Eroare la actualizarea statusului:', err);
      alert(`Eroare: ${err.response?.data?.message || 'Nu s-a putut actualiza statusul'}`);
      setShowStatusModal(false);
    }
  };
  
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.cityId) {
        alert('Vă rugăm să selectați un oraș pentru programare!');
        return;
      }
      
      const pnccServiceData = {
        patientName: formData.patientName,
        pickupPoint: formData.pickupLocation,
        dropoffPoint: formData.destinationLocation,
        city: formData.cityId,
        status: mapFrontendStatus(formData.status),
        notes: formData.notes,
        startDate: formData.startDate,
        procedureCount: parseInt(formData.procedureCount, 10),
        assistant: formData.brigadeEmployeeId || undefined
      };
      
      console.log('Trimit date pentru actualizarea programării:', pnccServiceData);
      
      const response = await axios.put(`/api/pncc-services/${bookingToEdit._id}`, pnccServiceData);
      
      if (response.data && response.data.success) {
        const selectedCity = cities.find(city => city._id === formData.cityId);
        const cityName = selectedCity ? selectedCity.name : 'Necunoscut';
        
        let assistantName = 'Nealocat';
        if (formData.brigadeEmployeeId) {
          const foundMember = brigadeMembers.find(m => m._id === formData.brigadeEmployeeId);
          assistantName = foundMember ? foundMember.name : 'Asistent necunoscut';
        }
        
        const updatedBooking = {
          ...bookingToEdit,
          patientName: formData.patientName,
          pickupLocation: formData.pickupLocation,
          destinationLocation: formData.destinationLocation,
          startDate: formData.startDate,
          procedureCount: parseInt(formData.procedureCount, 10),
          city: cityName,
          cityId: formData.cityId,
          assistantName: assistantName,
          assistantId: formData.brigadeEmployeeId || null,
          status: formData.status,
          notes: formData.notes
        };
        
        setBookings(prevBookings => 
          prevBookings.map(b => 
            b._id === bookingToEdit._id ? updatedBooking : b
          )
        );
        
        setShowEditModal(false);
        setBookingToEdit(null);
        
        // Resetăm formularul
        setFormData({
          patientName: '',
          pickupLocation: '',
          destinationLocation: '',
          startDate: new Date().toISOString().split('T')[0],
          procedureCount: 1,
          notes: '',
          status: 'Urmează',
          brigadeEmployeeId: '',
          cityId: ''
        });
        
        alert('Programarea a fost actualizată cu succes!');
        
        // Reîncărcăm datele pentru a fi siguri că totul este sincronizat
        setTimeout(() => {
          fetchBookings();
        }, 1000);
      } else {
        alert('Eroare la actualizarea programării. Verificați datele și reîncercați.');
      }
    } catch (err) {
      console.error('Eroare la actualizarea programării:', err);
      alert(`Eroare: ${err.response?.data?.message || 'Nu s-a putut actualiza programarea'}`);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.cityId) {
        alert('Vă rugăm să selectați un oraș pentru programare!');
        return;
      }
      
      const pnccServiceData = {
        patientName: formData.patientName,
        pickupPoint: formData.pickupLocation,
        dropoffPoint: formData.destinationLocation,
        city: formData.cityId,
        status: mapFrontendStatus(formData.status),
        notes: formData.notes,
        startDate: formData.startDate,
        procedureCount: parseInt(formData.procedureCount, 10)
      };
      
      console.log('Trimit date privind programarea PNCC:', pnccServiceData);
      
      const response = await axios.post('/api/pncc-services', pnccServiceData);
      
      const createdService = response.data.data;
      
      // Încarcă documentul după crearea programării, dacă există un fișier selectat
      let documentData = null;
      
      if (selectedFile) {
        try {
          setIsUploading(true);
          setUploadProgress(0);
          
          const docFormData = new FormData();
          docFormData.append('document', selectedFile);
          
          const uploadResponse = await axios.post(
            `/api/pncc-services/${createdService._id}/documents`,
            docFormData,
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
          
          if (uploadResponse.data && uploadResponse.data.success) {
            documentData = uploadResponse.data.data;
            console.log('Document încărcat cu succes:', documentData);
          }
        } catch (uploadErr) {
          console.error('Eroare la încărcarea documentului:', uploadErr);
          alert(`Programarea a fost creată, dar a apărut o eroare la încărcarea documentului: ${uploadErr.response?.data?.message || 'Eroare la încărcare'}`);
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
          setSelectedFile(null);
        }
      }
      
      const selectedCity = cities.find(city => city._id === formData.cityId);
      const cityName = selectedCity ? selectedCity.name : 'Necunoscut';
      
      const newBooking = {
        _id: createdService._id,
        patientName: formData.patientName,
        pickupLocation: createdService.pickupPoint,
        destinationLocation: createdService.dropoffPoint,
        startDate: formData.startDate,
        procedureCount: parseInt(formData.procedureCount, 10),
        city: cityName,
        cityId: formData.cityId,
        assistantName: 'Nealocat',
        assistantId: null,
        status: formData.status,
        notes: formData.notes,
        documents: documentData ? [documentData] : []
      };
      
      setBookings([newBooking, ...bookings]);
      setShowAddModal(false);
      
      setFormData({
        patientName: '',
        pickupLocation: '',
        destinationLocation: '',
        startDate: new Date().toISOString().split('T')[0],
        procedureCount: 1,
        notes: '',
        status: 'Urmează',
        brigadeEmployeeId: '',
        cityId: ''
      });
      
      alert('Programarea a fost adăugată cu succes!');
    } catch (err) {
      console.error('Eroare la adăugare:', err);
      alert(`Eroare: ${err.response?.data?.message || 'Nu s-a putut adăuga programarea'}`);
    }
  };
  
  const getStatusStyle = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    if (!statusOption) return { icon: faClock, color: 'secondary' };
    return statusOption;
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
              placeholder="Nume pacient, locație..."
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
                <option value="Suceava">Suceava</option>
                <option value="Botoșani">Botoșani</option>
              </select>
            </div>
          </div>
        )}
        
        <div className="col-md-2">
          <div className="form-group">
            <label className="form-label">
              <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
              Data începerii
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
              <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
              Status
            </label>
            <select 
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Toate statusurile</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.value}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="col-md-2">
          <div className="form-group">
            <label className="form-label">
              <FontAwesomeIcon icon={faSortAmountDown} className="me-2" />
              Sortează după
            </label>
            <select 
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Data începerii</option>
              <option value="patientName">Nume pacient</option>
              <option value="procedureCount">Număr proceduri</option>
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
              onClick={fetchBookings}
            >
              <FontAwesomeIcon icon={faSync} className="me-2" />
              Reîmprospătează
            </button>
            
            <button 
              className="btn btn-success"
              onClick={handleAddNewBooking}
            >
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Adaugă programare PNCC
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderBookingsTable = () => (
    <div className="content-card">
      <h5 className="mb-4">
        <FontAwesomeIcon icon={faAmbulance} className="me-2" />
        Programări PNCC ({filteredBookings.length})
      </h5>
      
      <div className="table-responsive">
        <table className="table table-hover booking-table">
          <thead>
            <tr>
              <th>Pacient</th>
              <th>Locații</th>
              <th>Data începerii</th>
              <th>Proceduri</th>
              <th>Status</th>
              <th>Documente</th>
              {isAdmin && <th>Asistent</th>}
              <th>Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map(booking => {
              const statusStyle = getStatusStyle(booking.status);
              const hasDocuments = booking.documents && booking.documents.length > 0;
              
              return (
                <tr key={booking._id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="me-2 patient-avatar">
                        <FontAwesomeIcon icon={faUser} />
                      </div>
                      <div>
                        <div className="fw-bold">{booking.patientName}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="mb-1">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1 text-primary" />
                      {booking.pickupLocation}
                    </div>
                    <div>
                      <FontAwesomeIcon icon={faArrowRight} className="me-1 text-muted" />
                      {booking.destinationLocation}
                    </div>
                  </td>
                  <td>
                    <div>
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-1 text-muted" />
                      {formatDate(booking.startDate)}
                    </div>
                  </td>
                  <td>
                    <div>
                      <FontAwesomeIcon icon={faListOl} className="me-1 text-muted" />
                      {booking.procedureCount}
                    </div>
                  </td>
                  <td>
                    <div className={`badge rounded-pill text-bg-${statusStyle.color}`}>
                      <FontAwesomeIcon icon={statusStyle.icon} className="me-1" />
                      {booking.status}
                    </div>
                  </td>
                  <td>
                    {hasDocuments ? (
                      <Badge bg="info" pill>
                        <FontAwesomeIcon icon={faPaperclip} className="me-1" />
                        {booking.documents.length}
                      </Badge>
                    ) : (
                      <span className="text-muted small">Fără documente</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="me-2 assistant-avatar">
                          <FontAwesomeIcon icon={faUserNurse} size="xs" />
                        </div>
                        <div>
                          {booking.assistantName}
                        </div>
                      </div>
                    </td>
                  )}
                  <td>
                    <div className="d-flex">
                      <button 
                        className="btn btn-sm btn-primary me-1"
                        onClick={() => handleViewBooking(booking)}
                        title="Vezi detalii"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      
                      <button 
                        className="btn btn-sm btn-info me-1"
                        onClick={() => handleStatusInit(booking)}
                        title="Schimbă status"
                      >
                        <FontAwesomeIcon icon={statusStyle.icon} />
                      </button>
                      
                      {(isAdmin || booking.assistantId === user._id) && (
                        <>
                          <button 
                            className="btn btn-sm btn-warning me-1"
                            onClick={() => handleEditInit(booking)}
                            title="Editează"
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </button>
                          
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteInit(booking)}
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
      
      {filteredBookings.length === 0 && !loading && (
        <div className="text-center py-4">
          <p className="text-muted">Nu există programări PNCC înregistrate.</p>
          <button 
            className="btn btn-success mt-3"
            onClick={handleAddNewBooking}
          >
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Adaugă prima programare PNCC
          </button>
        </div>
      )}
    </div>
  );
  
  const renderAddBookingModal = () => (
    <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" centered className="booking-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Adaugă programare PNCC
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loadingMembers || loadingCities ? (
          <div className="text-center py-3">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2">Se încarcă datele necesare...</p>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-12">
                <Form.Group className="mb-3">
                  <Form.Label>Nume și prenume pacient *</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-12">
                <Form.Group className="mb-3">
                  <Form.Label>Adresă preluare *</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="pickupLocation"
                    value={formData.pickupLocation}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-12">
                <Form.Group className="mb-3">
                  <Form.Label>Adresă destinație *</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="destinationLocation"
                    value={formData.destinationLocation}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faCalendarWeek} className="me-2" />
                    Data începerii *
                  </Form.Label>
                  <Form.Control 
                    type="date" 
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faListOl} className="me-2" />
                    Număr proceduri *
                  </Form.Label>
                  <Form.Control 
                    type="number" 
                    name="procedureCount"
                    min="1"
                    value={formData.procedureCount}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Status *</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.value}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-12">
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
            
            {/* Secțiune pentru încărcarea documentelor */}
            <div className="document-upload-section mt-4">
              <h5 className="mb-3">
                <FontAwesomeIcon icon={faPaperclip} className="me-2" />
                Documente
              </h5>
              
              <div className="mb-3">
                <div className="d-flex align-items-center">
                  <Button 
                    variant="outline-primary" 
                    className="me-2"
                    onClick={() => document.getElementById('add-document-file').click()}
                  >
                    <FontAwesomeIcon icon={faFileUpload} className="me-2" />
                    Încarcă document
                  </Button>
                  
                  <Button 
                    variant="outline-info" 
                    className="me-3"
                    onClick={() => document.getElementById('add-document-camera').click()}
                  >
                    <FontAwesomeIcon icon={faCamera} className="me-2" />
                    Fă o poză
                  </Button>
                  
                  {/* Input pentru documente (inclusiv imagini) */}
                  <input
                    type="file"
                    id="add-document-file"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  />
                  
                  {/* Input pentru camera */}
                  <input
                    type="file"
                    id="add-document-camera"
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
          disabled={loadingMembers || loadingCities || isUploading}
        >
          Salvează programare
        </Button>
      </Modal.Footer>
    </Modal>
  );
  
  const renderEditBookingModal = () => (
    <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered className="booking-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faPen} className="me-2" />
          Editează programare PNCC
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loadingMembers || loadingCities ? (
          <div className="text-center py-3">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2">Se încarcă datele necesare...</p>
          </div>
        ) : (
          <Form onSubmit={handleEditSubmit}>
            <div className="row mb-3">
              <div className="col-md-12">
                <Form.Group className="mb-3">
                  <Form.Label>Nume și prenume pacient *</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-12">
                <Form.Group className="mb-3">
                  <Form.Label>Adresă preluare *</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="pickupLocation"
                    value={formData.pickupLocation}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-12">
                <Form.Group className="mb-3">
                  <Form.Label>Adresă destinație *</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="destinationLocation"
                    value={formData.destinationLocation}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faCalendarWeek} className="me-2" />
                    Data începerii *
                  </Form.Label>
                  <Form.Control 
                    type="date" 
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                <Form.Label>
                    <FontAwesomeIcon icon={faListOl} className="me-2" />
                    Număr proceduri *
                  </Form.Label>
                  <Form.Control 
                    type="number" 
                    name="procedureCount"
                    min="1"
                    value={formData.procedureCount}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Status *</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.value}
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
              
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faUserNurse} className="me-2" />
                    Asistent
                  </Form.Label>
                  {brigadeMembers.length > 0 ? (
                    <Form.Select
                      name="brigadeEmployeeId"
                      value={formData.brigadeEmployeeId}
                      onChange={handleInputChange}
                    >
                      <option value="">Nealocat</option>
                      {brigadeMembers.map(member => (
                        <option key={member._id} value={member._id}>
                          {member.name} ({member.city})
                        </option>
                      ))}
                    </Form.Select>
                  ) : (
                    <div className="alert alert-warning">
                      Nu s-au găsit membri ai brigăzii disponibili.
                    </div>
                  )}
                </Form.Group>
              </div>
            </div>
            
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
              Documentele pot fi gestionate din vizualizarea detaliată a programării.
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
          disabled={loadingMembers || loadingCities}
        >
          Salvează modificările
        </Button>
      </Modal.Footer>
    </Modal>
  );
  
  const renderViewBookingModal = () => (
    <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered className="booking-modal">
      <Modal.Header closeButton>
        <Modal.Title>Detalii programare PNCC</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {currentBooking && (
          <div className="booking-details">
            <div className="mb-4">
              <h5 className="mb-3">Informații pacient</h5>
              <p><strong>Nume:</strong> {currentBooking.patientName}</p>
            </div>
            
            <div className="mb-4">
              <h5 className="mb-3">Locații</h5>
              <p>
                <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-primary" />
                <strong>Preluare:</strong> {currentBooking.pickupLocation}
              </p>
              <p>
                <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-success" />
                <strong>Destinație:</strong> {currentBooking.destinationLocation}
              </p>
            </div>
            
            <div className="mb-4">
              <h5 className="mb-3">Programare</h5>
              <p>
                <FontAwesomeIcon icon={faCalendarWeek} className="me-2" />
                <strong>Data începerii:</strong> {formatDate(currentBooking.startDate)}
              </p>
              <p>
                <FontAwesomeIcon icon={faListOl} className="me-2" />
                <strong>Număr proceduri:</strong> {currentBooking.procedureCount}
              </p>
              <p>
                <FontAwesomeIcon icon={faCity} className="me-2" />
                <strong>Oraș:</strong> {currentBooking.city}
              </p>
              <p>
                <FontAwesomeIcon 
                  icon={getStatusStyle(currentBooking.status).icon} 
                  className={`me-2 text-${getStatusStyle(currentBooking.status).color}`} 
                />
                <strong>Status:</strong> {currentBooking.status}
              </p>
              {currentBooking.notes && (
                <div className="mt-3">
                  <p><strong>Note:</strong></p>
                  <p>{currentBooking.notes}</p>
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <h5 className="mb-3">Brigada Ambu-Life</h5>
              <p>
                <FontAwesomeIcon icon={faUserNurse} className="me-2 text-info" />
                <strong>Membru brigada:</strong> {currentBooking.assistantName}
              </p>
            </div>
            
            <div className="mb-4">
              <h5 className="d-flex justify-content-between align-items-center mb-3">
                <span>Documente</span>
                <div>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => document.getElementById('document-upload').click()}
                    className="me-2"
                  >
                    <FontAwesomeIcon icon={faFileUpload} className="me-1" />
                    Încarcă document
                  </Button>
                  <Button 
                    variant="outline-info" 
                    size="sm"
                    onClick={() => document.getElementById('document-camera').click()}
                  >
                    <FontAwesomeIcon icon={faCamera} className="me-1" />
                    Fă o poză
                  </Button>
                </div>
              </h5>
              
              <input
                type="file"
                id="document-upload"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              />
              
              <input
                type="file"
                id="document-camera"
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
                        onClick={() => handleUploadDocument(currentBooking._id)}
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
              
              {currentBooking.documents && Array.isArray(currentBooking.documents) && currentBooking.documents.length > 0 ? (
                <div className="documents-list">
                  <ul className="list-group">
                    {currentBooking.documents.map((doc, index) => {
                      // Verificăm dacă documentul are un ID valid
                      if (!doc || !doc._id) {
                        return (
                          <li key={`loading-doc-${index}`} className="list-group-item">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                <span>{doc?.name || 'Se procesează documentul...'}</span>
                              </div>
                              <Button 
                                variant="outline-secondary" 
                                size="sm"
                                disabled
                              >
                                <FontAwesomeIcon icon={faDownload} />
                              </Button>
                            </div>
                          </li>
                        );
                      }
                      
                      return (
                        <li key={doc._id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <FontAwesomeIcon icon={getFileIcon(doc.mimetype || 'unknown')} className="me-2" />
                              <span>{doc.name || 'Document necunoscut'}</span>
                              <span className="text-muted ms-2">({formatFileSize(doc.size || 0)})</span>
                            </div>
                            <div>
                              <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                className="me-2"
                                onClick={() => {
                                  console.log('Download document with ID:', doc._id);
                                  handleDownloadDocument(currentBooking._id, doc._id, doc.name);
                                }}
                              >
                                <FontAwesomeIcon icon={faDownload} />
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleDeleteDocumentInit(currentBooking._id, doc._id)}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </Button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-3 border rounded">
                  <p className="text-muted mb-0">
                    <FontAwesomeIcon icon={faPaperclip} className="me-2" />
                    Nu există documente atașate. Încărcați un document pentru această programare.
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
        {bookingToDelete && (
          <p>
            Sunteți sigur că doriți să ștergeți programarea PNCC pentru <strong>{bookingToDelete.patientName}</strong> din data <strong>{formatDate(bookingToDelete.startDate)}</strong>?
            {bookingToDelete.documents && bookingToDelete.documents.length > 0 && (
              <span className="text-danger d-block mt-2">
                <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
                Această programare are {bookingToDelete.documents.length} documente atașate care vor fi șterse permanent.
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
          Șterge programare
        </Button>
      </Modal.Footer>
    </Modal>
  );
  
  const renderDocumentDeleteConfirmModal = () => (
    <Modal show={showDocumentDeleteConfirm} onHide={() => setShowDocumentDeleteConfirm(false)} centered className="booking-modal">
      <Modal.Header closeButton>
        <Modal.Title>Confirmare ștergere document</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Sunteți sigur că doriți să ștergeți acest document? Această acțiune este permanentă și nu poate fi anulată.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowDocumentDeleteConfirm(false)}>
          Anulează
        </Button>
        <Button variant="danger" onClick={handleDeleteDocumentConfirm}>
          <FontAwesomeIcon icon={faTrash} className="me-1" />
          Șterge document
        </Button>
      </Modal.Footer>
    </Modal>
  );
  
  const renderStatusModal = () => (
    <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered className="booking-modal">
      <Modal.Header closeButton>
        <Modal.Title>Actualizare status</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {bookingToUpdateStatus && (
          <div>
            <p>
              Actualizați statusul pentru programarea pacientului <strong>{bookingToUpdateStatus.patientName}</strong>:
            </p>
            
            <div className="user-info-panel">
              <p className="user-name">
                <strong>{user.name}</strong> {user.role === 'admin' ? '(Administrator)' : '(Asistent)'}
              </p>
              <p className="user-details">
                <small>Oraș: {typeof user.city === 'object' ? user.city.name : 
                              (typeof user.city === 'string' && user.city === '6823053af3c9fed99da59f39') ? 'Suceava' :
                              (typeof user.city === 'string' && user.city === '6823053af3c9fed99da59f3a') ? 'Botoșani' : 
                              'Necunoscut'}</small>
              </p>
            </div>
            
            <div className="d-flex flex-column gap-2 mt-4">
              {statusOptions.map(option => {
                const isCompleted = option.value === 'Finalizat';
                const needsAssistantSelection = isCompleted && 
                  !bookingToUpdateStatus.assistantId && 
                  isAdmin;
                
                return (
                  <div key={option.value}>
                    {needsAssistantSelection && (
                      <div className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            <FontAwesomeIcon icon={faUsers} className="me-2" />
                            Selectați cine a finalizat procedurile:
                          </Form.Label>
                          {loadingMembers ? (
                            <div className="text-center py-2">
                              <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                              <span className="ms-2">Se încarcă membrii brigăzii...</span>
                            </div>
                          ) : brigadeMembers.length > 0 ? (
                            <Form.Select
                              value={formData.brigadeEmployeeId}
                              onChange={(e) => setFormData({...formData, brigadeEmployeeId: e.target.value})}
                              className="mb-2"
                            >
                              <option value="">Selectați un membru al brigăzii</option>
                              {brigadeMembers.map(member => (
                                <option key={member._id} value={member._id}>
                                  {member.name} ({member.city})
                                </option>
                              ))}
                            </Form.Select>
                          ) : (
                            <div className="alert alert-warning">
                              Nu s-au găsit membri ai brigăzii disponibili.
                            </div>
                          )}
                        </Form.Group>
                      </div>
                    )}
                    
                    <Button
                      variant={option.color}
                      className={`status-button ${option.value.toLowerCase()}`}
                      onClick={() => {
                        if (isCompleted && !isAdmin) {
                          console.log("Non-admin setează ID-ul propriu:", user._id);
                        }
                        
                        handleStatusUpdate(option.value);
                      }}
                      disabled={needsAssistantSelection && !formData.brigadeEmployeeId}
                    >
                      <FontAwesomeIcon icon={option.icon} className="me-2" />
                      {option.value}
                      {needsAssistantSelection && !formData.brigadeEmployeeId && 
                        ' (Selectați un membru al brigăzii)'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" className="btn-anuleaza" onClick={() => setShowStatusModal(false)}>
          Anulează
        </Button>
      </Modal.Footer>
    </Modal>
  );
  
  // Adăugăm stilizare CSS pentru funcționalitățile noi
  const customStyles = `
    .user-info-panel {
      background-color: #f0f8ff;
      border-radius: 8px;
      border-left: 4px solid #3498db;
      padding: 12px 16px;
      margin-bottom: 20px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    }

    .user-info-panel p {
      margin: 0;
      padding: 0;
    }

    .user-info-panel .user-name {
      font-weight: 600;
      font-size: 1.1rem;
      color: #2c3e50;
    }

    .user-info-panel .user-details {
      font-size: 0.9rem;
      color: #7f8c8d;
      margin-top: 4px;
    }

    .status-button {
      border-radius: 8px;
      font-weight: 500;
      padding: 10px 16px;
      margin: 8px 0;
      transition: all 0.2s ease;
      border: none;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .status-button svg {
      margin-right: 8px;
    }

    .status-button.finalizat {
      background-color: #2ecc71;
      color: white;
    }

    .status-button.finalizat:hover {
      background-color: #27ae60;
    }

    .status-button.urmează {
      background-color: #3498db;
      color: white;
    }

    .status-button.urmează:hover {
      background-color: #2980b9;
    }

    .status-button.anulat {
      background-color: #e74c3c;
      color: white;
    }

    .status-button.anulat:hover {
      background-color: #c0392b;
    }

    .documents-list .list-group-item {
      transition: all 0.2s ease;
    }

    .documents-list .list-group-item:hover {
      background-color: #f8f9fa;
    }

    .selected-file-info {
      padding: 10px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      background-color: #f8f9fa;
    }
  `;
  
  return (
    <Layout>
      <style>{customStyles}</style>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>
            <FontAwesomeIcon icon={faAmbulance} className="me-2" />
            Programări PNCC
          </h1>
        </div>
        
        {renderFilters()}
        
        {loading ? (
          <div className="content-card">
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2">Se încarcă programările...</p>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          renderBookingsTable()
        )}
        
        {renderAddBookingModal()}
        {renderViewBookingModal()}
        {renderEditBookingModal()}
        {renderDeleteConfirmModal()}
        {renderStatusModal()}
        {renderDocumentDeleteConfirmModal()}
      </div>
    </Layout>
  );
};

export default PNCCBookings;