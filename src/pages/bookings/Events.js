import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faAmbulance, 
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
  faCar
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import { Modal, Button, Form, Badge, ProgressBar } from 'react-bootstrap';

const Events = () => {
  const { user } = useSelector(state => state.auth);
  const isAdmin = user && user.role === 'admin';
  
  const [events, setEvents] = useState([]);
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
  const [currentEvent, setCurrentEvent] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [eventToUpdateStatus, setEventToUpdateStatus] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  
  // State pentru încărcarea documentelor
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [showDocumentDeleteConfirm, setShowDocumentDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    eventName: '',
    eventDate: new Date().toISOString().split('T')[0],
    eventTime: '12:00',
    ambulanceType: 'B1',
    notes: '',
    status: 'Urmează',
    cityId: '',
    brigadeEmployeeId: ''
  });

  const ambulanceTypes = [
    { value: 'B1', label: 'B1 - Ambulanță de prim ajutor' },
    { value: 'B2', label: 'B2 - Ambulanță de consultații' }
  ];

  const statusOptions = [
    { value: 'Finalizat', icon: faCheckCircle, color: 'success' },
    { value: 'Urmează', icon: faClock, color: 'primary' },
    { value: 'Anulat', icon: faTrash, color: 'danger' }
  ];
  
  useEffect(() => {
    if (user) {
      fetchBrigadeMembers();
      fetchCities();
    }
  }, [user]);
  
  useEffect(() => {
    if (user && brigadeMembers.length > 0) {
      fetchEvents();
    }
  }, [user, brigadeMembers]);
  
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/event-services');
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        const eventsData = await Promise.all(response.data.data.map(async event => {
          // Formatăm data și ora
          const eventDate = new Date(event.date);
          const formattedDate = eventDate.toISOString().split('T')[0];
          const formattedTime = eventDate.toTimeString().slice(0, 5);
          
          // Extragem numele și ID-ul orașului
          let cityName = 'Necunoscut';
          let cityId = null;
          
          if (event.city) {
            if (typeof event.city === 'object') {
              cityName = event.city.name || 'Necunoscut';
              cityId = event.city._id;
            } else if (typeof event.city === 'string') {
              cityId = event.city;
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
          
          if (event.assistant) {
            if (typeof event.assistant === 'object') {
              assistantName = event.assistant.name || 'Nealocat';
              assistantId = event.assistant._id;
            } else if (typeof event.assistant === 'string') {
              assistantId = event.assistant;
              
              if (assistantId === user._id) {
                assistantName = user.name;
              } else {
                const foundMember = brigadeMembers.find(m => m._id === assistantId);
                if (foundMember) {
                  assistantName = foundMember.name;
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
          }
          
          // Procesăm documentele
          const documents = event.documents || [];
          
          return {
            _id: event._id,
            eventName: event.eventName,
            eventDate: formattedDate,
            eventTime: formattedTime,
            ambulanceType: event.ambulanceType,
            city: cityName,
            cityId,
            assistantName,
            assistantId,
            status: mapBackendStatus(event.status),
            notes: event.notes,
            documents,
          };
        }));
        
        const forcedEventsData = eventsData.map(event => {
          if (event.assistantId === user._id) {
            return {
              ...event,
              assistantName: user.name
            };
          }
          return event;
        });
        
        const userCityId = user.city && typeof user.city === 'object' 
          ? user.city._id 
          : typeof user.city === 'string' 
            ? user.city 
            : null;
            
        const filteredEvents = isAdmin 
          ? forcedEventsData 
          : forcedEventsData.filter(event => event.cityId === userCityId);
        
        setEvents(filteredEvents);
      } else {
        console.warn('Nu s-au găsit evenimente în răspunsul API-ului sau formatul datelor este incorect.');
        setEvents([]);
      }
      
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Eroare la încărcarea evenimentelor:', err);
      setError(err.response?.data?.message || 'Nu s-au putut obține evenimentele. Vă rugăm să reîncercați mai târziu.');
      setLoading(false);
      setEvents([]);
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
    }
  };
  
  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      searchTerm === '' || 
      event.eventName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = cityFilter === '' || event.city === cityFilter;
    
    const matchesDate = dateFilter === '' || 
      event.eventDate === dateFilter;
    
    const matchesStatus = statusFilter === '' || event.status === statusFilter;
    
    return matchesSearch && matchesCity && matchesDate && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(`${a.eventDate}T${a.eventTime}`);
      const dateB = new Date(`${b.eventDate}T${b.eventTime}`);
      return sortOrder === 'asc' 
        ? dateA - dateB 
        : dateB - dateA;
    } else if (sortBy === 'eventName') {
      return sortOrder === 'asc'
        ? a.eventName.localeCompare(b.eventName)
        : b.eventName.localeCompare(a.eventName);
    }
    return 0;
  });
  
  const formatDateTime = (date, time) => {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
  
  const handleUploadDocument = async (eventId) => {
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
        `/api/event-services/${eventId}/documents`,
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
        
        // Reîncarcă evenimentul pentru a obține documentele actualizate
        try {
          const eventResponse = await axios.get(`/api/event-services/${eventId}`);
          
          if (eventResponse.data && eventResponse.data.success) {
            const updatedEvent = eventResponse.data.data;
            
            // Formatăm data și ora pentru afișare
            const eventDate = new Date(updatedEvent.date);
            const formattedDate = eventDate.toISOString().split('T')[0];
            const formattedTime = eventDate.toTimeString().slice(0, 5);
            
            // Procesează orașul
            let cityName = 'Necunoscut';
            let cityId = null;
            
            if (updatedEvent.city) {
              if (typeof updatedEvent.city === 'object') {
                cityName = updatedEvent.city.name || 'Necunoscut';
                cityId = updatedEvent.city._id;
              } else if (typeof updatedEvent.city === 'string') {
                cityId = updatedEvent.city;
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
            
            if (updatedEvent.assistant) {
              if (typeof updatedEvent.assistant === 'object') {
                assistantName = updatedEvent.assistant.name || 'Nealocat';
                assistantId = updatedEvent.assistant._id;
              } else if (typeof updatedEvent.assistant === 'string') {
                assistantId = updatedEvent.assistant;
                
                const foundMember = brigadeMembers.find(m => m._id === assistantId);
                if (foundMember) {
                  assistantName = foundMember.name;
                }
              }
            }
            
            // Creăm obiectul formatat pentru afișare
            const formattedEvent = {
              _id: updatedEvent._id,
              eventName: updatedEvent.eventName,
              eventDate: formattedDate,
              eventTime: formattedTime,
              ambulanceType: updatedEvent.ambulanceType,
              city: cityName,
              cityId,
              assistantName,
              assistantId,
              status: mapBackendStatus(updatedEvent.status),
              notes: updatedEvent.notes,
              documents: updatedEvent.documents || []
            };
            
            // Actualizăm event-ul curent dacă este cel care se afișează
            if (currentEvent && currentEvent._id === eventId) {
              setCurrentEvent(formattedEvent);
            }
            
            // Actualizăm și lista generală de evenimente
            setEvents(prevEvents => 
              prevEvents.map(e => 
                e._id === eventId ? formattedEvent : e
              )
            );
          }
        } catch (fetchErr) {
          console.error('Eroare la reîncărcarea evenimentului după încărcare document:', fetchErr);
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
  
  const handleDeleteDocumentInit = (eventId, documentId) => {
    setDocumentToDelete({ eventId, documentId });
    setShowDocumentDeleteConfirm(true);
  };
  
  const handleDeleteDocumentConfirm = async () => {
    try {
      const { eventId, documentId } = documentToDelete;
      
      await axios.delete(`/api/event-services/${eventId}/documents/${documentId}`);
      
      // Actualizăm lista de documente pentru event-ul curent
      if (currentEvent && currentEvent._id === eventId) {
        setCurrentEvent({
          ...currentEvent,
          documents: currentEvent.documents.filter(doc => doc._id !== documentId)
        });
      }
      
      // Actualizăm și lista generală
      setEvents(prevEvents => 
        prevEvents.map(e => {
          if (e._id === eventId) {
            return {
              ...e,
              documents: (e.documents || []).filter(doc => doc._id !== documentId)
            };
          }
          return e;
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
  
  const handleDownloadDocument = async (eventId, documentId, documentName) => {
    try {
      // Verifică dacă documentId este valid
      if (!documentId) {
        console.error('ID document invalid:', documentId);
        alert('ID document invalid. Nu se poate descărca documentul.');
        return;
      }
      
      const response = await axios.get(`/api/event-services/${eventId}/documents/${documentId}/download`, {
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
  
  const handleViewEvent = (event) => {
    setCurrentEvent(event);
    setShowViewModal(true);
  };
  
  const handleAddNewEvent = () => {
    const initialFormData = {
      eventName: '',
      eventDate: new Date().toISOString().split('T')[0],
      eventTime: '12:00',
      ambulanceType: 'B1',
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
  
  const handleEditInit = (event) => {
    // Populăm formularul cu datele evenimentului existent
    setFormData({
      eventName: event.eventName,
      eventDate: event.eventDate,
      eventTime: event.eventTime,
      ambulanceType: event.ambulanceType,
      notes: event.notes,
      status: event.status,
      cityId: event.cityId,
      brigadeEmployeeId: event.assistantId || ''
    });
    
    setEventToEdit(event);
    setShowEditModal(true);
  };
  
  const handleDeleteInit = (event) => {
    setEventToDelete(event);
    setShowDeleteConfirm(true);
  };
  
  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/event-services/${eventToDelete._id}`);
      
      setEvents(events.filter(e => e._id !== eventToDelete._id));
      
      setShowDeleteConfirm(false);
      setEventToDelete(null);
      
      alert('Evenimentul a fost șters cu succes');
    } catch (err) {
      console.error('Eroare la ștergere:', err);
      alert(`Eroare: ${err.response?.data?.message || 'Nu s-a putut șterge evenimentul'}`);
      setShowDeleteConfirm(false);
    }
  };
  
  const handleStatusInit = (event) => {
    const initialBrigadeEmployeeId = !isAdmin ? user._id : '';
    
    setFormData({
      ...formData,
      brigadeEmployeeId: initialBrigadeEmployeeId
    });
    
    setEventToUpdateStatus(event);
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
      } else if (newStatus === 'Finalizat' && isAdmin) {
        if (!formData.brigadeEmployeeId) {
          alert('Vă rugăm să selectați un membru al brigăzii care a finalizat evenimentul!');
          return;
        }
        updateData.assistant = formData.brigadeEmployeeId;
      }
      
      const response = await axios.put(`/api/event-services/${eventToUpdateStatus._id}`, updateData);
      
      if (response.data && response.data.success) {
        let updatedAssistantName = eventToUpdateStatus.assistantName;
        let updatedAssistantId = eventToUpdateStatus.assistantId;
        
        if (newStatus === 'Finalizat') {
          if (!isAdmin) {
            updatedAssistantName = user.name;
            updatedAssistantId = user._id;
          } else if (formData.brigadeEmployeeId) {
            const selectedEmployee = brigadeMembers.find(m => m._id === formData.brigadeEmployeeId);
            updatedAssistantName = selectedEmployee ? selectedEmployee.name : 'Necunoscut';
            updatedAssistantId = formData.brigadeEmployeeId;
          }
        }
        
        const updatedEvent = {
          ...eventToUpdateStatus,
          status: newStatus,
          assistantName: updatedAssistantName,
          assistantId: updatedAssistantId
        };
        
        setEvents(prevEvents => 
          prevEvents.map(e => 
            e._id === eventToUpdateStatus._id ? updatedEvent : e
          )
        );
        
        setFormData({
          ...formData,
          brigadeEmployeeId: ''
        });
        
        setShowStatusModal(false);
        setEventToUpdateStatus(null);
        
        alert(`Statusul a fost actualizat la: ${newStatus}`);
        
        setTimeout(async () => {
          await fetchBrigadeMembers();
          await fetchEvents();
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
        alert('Vă rugăm să selectați un oraș pentru eveniment!');
        return;
      }
      
      const eventData = {
        eventName: formData.eventName,
        city: formData.cityId,
        status: mapFrontendStatus(formData.status),
        ambulanceType: formData.ambulanceType,
        notes: formData.notes,
        date: formData.eventDate,
        time: formData.eventTime,
        assistant: formData.brigadeEmployeeId || undefined
      };
      
      const response = await axios.put(`/api/event-services/${eventToEdit._id}`, eventData);
      
      if (response.data && response.data.success) {
        const selectedCity = cities.find(city => city._id === formData.cityId);
        const cityName = selectedCity ? selectedCity.name : 'Necunoscut';
        
        let assistantName = 'Nealocat';
        if (formData.brigadeEmployeeId) {
          const foundMember = brigadeMembers.find(m => m._id === formData.brigadeEmployeeId);
          assistantName = foundMember ? foundMember.name : 'Asistent necunoscut';
        }
        
        const updatedEvent = {
          ...eventToEdit,
          eventName: formData.eventName,
          eventDate: formData.eventDate,
          eventTime: formData.eventTime,
          ambulanceType: formData.ambulanceType,
          city: cityName,
          cityId: formData.cityId,
          assistantName: assistantName,
          assistantId: formData.brigadeEmployeeId || null,
          status: formData.status,
          notes: formData.notes
        };
        
        setEvents(prevEvents => 
          prevEvents.map(e => 
            e._id === eventToEdit._id ? updatedEvent : e
          )
        );
        
        setShowEditModal(false);
        setEventToEdit(null);
        
        // Resetăm formularul
        setFormData({
          eventName: '',
          eventDate: new Date().toISOString().split('T')[0],
          eventTime: '12:00',
          ambulanceType: 'B1',
          notes: '',
          status: 'Urmează',
          brigadeEmployeeId: '',
          cityId: ''
        });
        
        alert('Evenimentul a fost actualizat cu succes!');
        
        // Reîncărcăm datele pentru a fi siguri că totul este sincronizat
        setTimeout(() => {
          fetchEvents();
        }, 1000);
      } else {
        alert('Eroare la actualizarea evenimentului. Verificați datele și reîncercați.');
      }
    } catch (err) {
      console.error('Eroare la actualizarea evenimentului:', err);
      alert(`Eroare: ${err.response?.data?.message || 'Nu s-a putut actualiza evenimentul'}`);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.cityId) {
        alert('Vă rugăm să selectați un oraș pentru eveniment!');
        return;
      }
      
      const eventData = {
        eventName: formData.eventName,
        city: formData.cityId,
        status: mapFrontendStatus(formData.status),
        ambulanceType: formData.ambulanceType,
        notes: formData.notes,
        date: formData.eventDate,
        time: formData.eventTime
      };
      
      const response = await axios.post('/api/event-services', eventData);
      
      const createdEvent = response.data.data;
      
      // Încarcă documentul după crearea evenimentului, dacă există un fișier selectat
      let documentData = null;
      
      if (selectedFile) {
        try {
          setIsUploading(true);
          setUploadProgress(0);
          
          const docFormData = new FormData();
          docFormData.append('document', selectedFile);
          
          const uploadResponse = await axios.post(
            `/api/event-services/${createdEvent._id}/documents`,
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
          }
        } catch (uploadErr) {
          console.error('Eroare la încărcarea documentului:', uploadErr);
          alert(`Evenimentul a fost creat, dar a apărut o eroare la încărcarea documentului: ${uploadErr.response?.data?.message || 'Eroare la încărcare'}`);
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
          setSelectedFile(null);
        }
      }
      
      const selectedCity = cities.find(city => city._id === formData.cityId);
      const cityName = selectedCity ? selectedCity.name : 'Necunoscut';
      
      const newEvent = {
        _id: createdEvent._id,
        eventName: formData.eventName,
        eventDate: formData.eventDate,
        eventTime: formData.eventTime,
        ambulanceType: formData.ambulanceType,
        city: cityName,
        cityId: formData.cityId,
        assistantName: 'Nealocat',
        assistantId: null,
        status: formData.status,
        notes: formData.notes,
        documents: documentData ? [documentData] : []
      };
      
      setEvents([newEvent, ...events]);
      setShowAddModal(false);
      
      setFormData({
        eventName: '',
        eventDate: new Date().toISOString().split('T')[0],
        eventTime: '12:00',
        ambulanceType: 'B1',
        notes: '',
        status: 'Urmează',
        brigadeEmployeeId: '',
        cityId: ''
      });
      
      alert('Evenimentul a fost adăugat cu succes!');
    } catch (err) {
      console.error('Eroare la adăugare:', err);
      alert(`Eroare: ${err.response?.data?.message || 'Nu s-a putut adăuga evenimentul'}`);
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
              placeholder="Nume eveniment..."
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
              <option value="date">Data și ora</option>
              <option value="eventName">Nume eveniment</option>
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
              onClick={fetchEvents}
            >
              <FontAwesomeIcon icon={faSync} className="me-2" />
              Reîmprospătează
            </button>
            
            <button 
              className="btn btn-success"
              onClick={handleAddNewEvent}
            >
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Adaugă eveniment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderEventsTable = () => (
    <div className="content-card">
      <h5 className="mb-4">
        <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
        Evenimente ({filteredEvents.length})
      </h5>
      
      <div className="table-responsive">
        <table className="table table-hover booking-table">
          <thead>
            <tr>
              <th>Numele Evenimentului</th>
              <th>Data și Ora</th>
              <th>Tip Ambulanță</th>
              <th>Status</th>
              <th>Documente</th>
              {isAdmin && <th>Asistent</th>}
              <th>Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map(event => {
              const statusStyle = getStatusStyle(event.status);
              const hasDocuments = event.documents && event.documents.length > 0;
              
              return (
                <tr key={event._id}>
                  <td>
                    <div className="fw-bold">{event.eventName}</div>
                  </td>
                  <td>
                    <div>
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-1 text-muted" />
                      {formatDateTime(event.eventDate, event.eventTime)}
                    </div>
                  </td>
                  <td>
                    <div>
                      <FontAwesomeIcon icon={faCar} className="me-1 text-muted" />
                      {event.ambulanceType}
                    </div>
                  </td>
                  <td>
                    <div className={`badge rounded-pill text-bg-${statusStyle.color}`}>
                      <FontAwesomeIcon icon={statusStyle.icon} className="me-1" />
                      {event.status}
                    </div>
                  </td>
                  <td>
                    {hasDocuments ? (
                      <Badge bg="info" pill>
                        <FontAwesomeIcon icon={faPaperclip} className="me-1" />
                        {event.documents.length}
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
                          {event.assistantName}
                        </div>
                      </div>
                    </td>
                  )}
                  <td>
                    <div className="d-flex">
                      <button 
                        className="btn btn-sm btn-primary me-1"
                        onClick={() => handleViewEvent(event)}
                        title="Vezi detalii"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      
                      <button 
                        className="btn btn-sm btn-info me-1"
                        onClick={() => handleStatusInit(event)}
                        title="Schimbă status"
                      >
                        <FontAwesomeIcon icon={statusStyle.icon} />
                      </button>
                      
                      {(isAdmin || event.assistantId === user._id) && (
                        <>
                          <button 
                            className="btn btn-sm btn-warning me-1"
                            onClick={() => handleEditInit(event)}
                            title="Editează"
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </button>
                          
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteInit(event)}
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
      
      {filteredEvents.length === 0 && !loading && (
        <div className="text-center py-4">
          <p className="text-muted">Nu există evenimente înregistrate.</p>
          <button 
            className="btn btn-success mt-3"
            onClick={handleAddNewEvent}
          >
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Adaugă primul eveniment
          </button>
        </div>
      )}
    </div>
  );
  
  const renderAddEventModal = () => (
    <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" centered className="booking-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Adaugă Eveniment
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
              <div className="col-12">
                <Form.Group className="mb-3">
                  <Form.Label>Nume eveniment *</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="eventName"
                    value={formData.eventName}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                    Data *
                  </Form.Label>
                  <Form.Control 
                    type="date" 
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faClock} className="me-2" />
                    Ora *
                  </Form.Label>
                  <Form.Control 
                    type="time" 
                    name="eventTime"
                    value={formData.eventTime}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faCar} className="me-2" />
                    Tip ambulanță *
                  </Form.Label>
                  <Form.Select
                    name="ambulanceType"
                    value={formData.ambulanceType}
                    onChange={handleInputChange}
                    required
                  >
                    {ambulanceTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
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
          Salvează eveniment
        </Button>
      </Modal.Footer>
    </Modal>
  );
  
  const renderEditEventModal = () => (
    <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered className="booking-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faPen} className="me-2" />
          Editează Eveniment
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
              <div className="col-12">
                <Form.Group className="mb-3">
                  <Form.Label>Nume eveniment *</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="eventName"
                    value={formData.eventName}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                    Data *
                  </Form.Label>
                  <Form.Control 
                    type="date" 
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faClock} className="me-2" />
                    Ora *
                  </Form.Label>
                  <Form.Control 
                    type="time" 
                    name="eventTime"
                    value={formData.eventTime}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faCar} className="me-2" />
                    Tip ambulanță *
                  </Form.Label>
                  <Form.Select
                    name="ambulanceType"
                    value={formData.ambulanceType}
                    onChange={handleInputChange}
                    required
                  >
                    {ambulanceTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
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
              Documentele pot fi gestionate din vizualizarea detaliată a evenimentului.
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
  
  const renderViewEventModal = () => (
    <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered className="booking-modal">
      <Modal.Header closeButton>
        <Modal.Title>Detalii Eveniment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {currentEvent && (
          <div className="event-details">
            <div className="mb-4">
              <h5 className="mb-3">Informații Eveniment</h5>
              <p><strong>Nume:</strong> {currentEvent.eventName}</p>
            </div>
            
            <div className="mb-4">
              <h5 className="mb-3">Programare</h5>
              <p>
                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                <strong>Data și ora:</strong> {formatDateTime(currentEvent.eventDate, currentEvent.eventTime)}
              </p>
              <p>
                <FontAwesomeIcon icon={faCar} className="me-2" />
                <strong>Tip ambulanță:</strong> {currentEvent.ambulanceType}
              </p>
              <p>
                <FontAwesomeIcon icon={faCity} className="me-2" />
                <strong>Oraș:</strong> {currentEvent.city}
              </p>
              <p>
              <FontAwesomeIcon 
                  icon={getStatusStyle(currentEvent.status).icon} 
                  className={`me-2 text-${getStatusStyle(currentEvent.status).color}`} 
                />
                <strong>Status:</strong> {currentEvent.status}
              </p>
              {currentEvent.notes && (
                <div className="mt-3">
                  <p><strong>Note:</strong></p>
                  <p>{currentEvent.notes}</p>
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <h5 className="mb-3">Brigada Ambu-Life</h5>
              <p>
                <FontAwesomeIcon icon={faUserNurse} className="me-2 text-info" />
                <strong>Membru brigada:</strong> {currentEvent.assistantName}
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
                        onClick={() => handleUploadDocument(currentEvent._id)}
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
              
              {currentEvent.documents && Array.isArray(currentEvent.documents) && currentEvent.documents.length > 0 ? (
                <div className="documents-list">
                  <ul className="list-group">
                    {currentEvent.documents.map((doc, index) => {
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
                                  handleDownloadDocument(currentEvent._id, doc._id, doc.name);
                                }}
                              >
                                <FontAwesomeIcon icon={faDownload} />
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleDeleteDocumentInit(currentEvent._id, doc._id)}
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
                    Nu există documente atașate. Încărcați un document pentru acest eveniment.
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
        {eventToDelete && (
          <p>
            Sunteți sigur că doriți să ștergeți evenimentul <strong>{eventToDelete.eventName}</strong> din data <strong>{formatDateTime(eventToDelete.eventDate, eventToDelete.eventTime)}</strong>?
            {eventToDelete.documents && eventToDelete.documents.length > 0 && (
              <span className="text-danger d-block mt-2">
                <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
                Acest eveniment are {eventToDelete.documents.length} documente atașate care vor fi șterse permanent.
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
          Șterge eveniment
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
        {eventToUpdateStatus && (
          <div>
            <p>
              Actualizați statusul pentru evenimentul <strong>{eventToUpdateStatus.eventName}</strong>:
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
                  !eventToUpdateStatus.assistantId && 
                  isAdmin;
                
                return (
                  <div key={option.value}>
                    {needsAssistantSelection && (
                      <div className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            <FontAwesomeIcon icon={faUsers} className="me-2" />
                            Selectați cine a finalizat evenimentul:
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
            <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
            Evenimente
          </h1>
        </div>
        
        {renderFilters()}
        
        {loading ? (
          <div className="content-card">
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2">Se încarcă evenimentele...</p>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          renderEventsTable()
        )}
        
        {renderAddEventModal()}
        {renderViewEventModal()}
        {renderEditEventModal()}
        {renderDeleteConfirmModal()}
        {renderStatusModal()}
        {renderDocumentDeleteConfirmModal()}
      </div>
    </Layout>
  );
};

export default Events;