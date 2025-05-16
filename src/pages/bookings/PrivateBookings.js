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
  faMoneyBillWave,
  faSearch,
  faFilter,
  faEye,
  faSortAmountDown,
  faSync,
  faPlus,
  faPen,
  faTrash,
  faMapMarkedAlt,
  faArrowRight,
  faCity,
  faCheckCircle,
  faSpinner,
  faClock,
  faUserNurse,
  faUsers,
  faBuilding
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import { Modal, Button, Form } from 'react-bootstrap';

const PrivateBookings = () => {
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
  
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    pickupLocation: '',
    destinationLocation: '',
    bookingDate: new Date().toISOString().split('T')[0],
    bookingTime: '12:00',
    amount: '',
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
      // Afișăm informații detaliate despre utilizatorul curent pentru debugging
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
  
  // Modificare fetchBookings pentru a actualiza detaliile asistentului la fiecare reîmprospătare
  const fetchBookings = async () => {
    setLoading(true);
    try {
      console.log('Utilizator curent la fetchBookings:', user.name, user._id);
      console.log('Încărcăm programările cu membrii brigăzii:', brigadeMembers);
      
      const response = await axios.get('/api/private-services');
      
      console.log('Răspuns API programări:', response.data);
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        const bookingsData = await Promise.all(response.data.data.map(async service => {
          const patientName = service.notes && service.notes.includes('Pacient:') 
            ? service.notes.split('Pacient:')[1].split(',')[0].trim() 
            : 'Pacient necunoscut';
            
          const patientPhone = service.notes && service.notes.includes('Telefon:') 
            ? service.notes.split('Telefon:')[1].split(',')[0].trim() 
            : 'Telefon necunoscut';
            
          const serviceDate = new Date(service.date);
          const bookingDate = serviceDate.toISOString().split('T')[0];
          const bookingTime = serviceDate.toTimeString().slice(0, 5);
          
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
          
          return {
            _id: service._id,
            patientName,
            patientPhone,
            pickupLocation: service.pickupPoint,
            destinationLocation: service.dropoffPoint,
            bookingDate,
            bookingTime,
            amount: service.amount,
            city: cityName,
            cityId,
            assistantName,
            assistantId,
            status: mapBackendStatus(service.status),
            notes: service.notes,
            vehicle: service.vehicle && typeof service.vehicle === 'object' 
              ? service.vehicle.plateNumber 
              : ''
          };
        }));
        
        console.log('Date programări procesate:', bookingsData);
        
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
      console.error('Eroare la încărcarea programărilor:', err);
      setError(err.response?.data?.message || 'Nu s-au putut obține programările. Vă rugăm să reîncercați mai târziu.');
      setLoading(false);
      setBookings([]);
    }
  };


  const handleEditInit = (booking) => {
    // Populăm formularul cu datele cursei existente
    setFormData({
      patientName: booking.patientName,
      patientPhone: booking.patientPhone,
      pickupLocation: booking.pickupLocation,
      destinationLocation: booking.destinationLocation,
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
      amount: booking.amount,
      notes: booking.notes,
      status: booking.status,
      cityId: booking.cityId,
      brigadeEmployeeId: booking.assistantId || ''
    });
    
    setBookingToEdit(booking);
    setShowEditModal(true);
  };
  
  // Adaugă această funcție pentru a procesa editarea
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.cityId) {
        alert('Vă rugăm să selectați un oraș pentru programare!');
        return;
      }
      
      const notesWithPatient = `Pacient: ${formData.patientName}, Telefon: ${formData.patientPhone}, ${formData.notes || ''}`;
      
      const combinedDate = new Date(`${formData.bookingDate}T${formData.bookingTime}`);
      
      const privateServiceData = {
        pickupPoint: formData.pickupLocation,
        dropoffPoint: formData.destinationLocation,
        amount: parseInt(formData.amount),
        distance: 0,
        vehicle: bookingToEdit.vehicle || "616fabc30f15d80d3f71e554",
        city: formData.cityId,
        status: mapFrontendStatus(formData.status),
        notes: notesWithPatient,
        date: combinedDate,
        assistant: formData.brigadeEmployeeId || undefined
      };
      
      console.log('Trimit date pentru actualizarea programării:', privateServiceData);
      
      const response = await axios.put(`/api/private-services/${bookingToEdit._id}`, privateServiceData);
      
      if (response.data && response.data.success) {
        // Actualizăm starea cu datele modificate
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
          patientPhone: formData.patientPhone,
          pickupLocation: formData.pickupLocation,
          destinationLocation: formData.destinationLocation,
          bookingDate: formData.bookingDate,
          bookingTime: formData.bookingTime,
          amount: parseInt(formData.amount),
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
          patientPhone: '',
          pickupLocation: '',
          destinationLocation: '',
          bookingDate: new Date().toISOString().split('T')[0],
          bookingTime: '12:00',
          amount: '',
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
      booking.patientPhone.includes(searchTerm) ||
      booking.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.destinationLocation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = cityFilter === '' || booking.city === cityFilter;
    
    const matchesDate = dateFilter === '' || 
      booking.bookingDate === dateFilter;
    
    const matchesStatus = statusFilter === '' || booking.status === statusFilter;
    
    return matchesSearch && matchesCity && matchesDate && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      const dateTimeA = new Date(`${a.bookingDate}T${a.bookingTime}`);
      const dateTimeB = new Date(`${b.bookingDate}T${b.bookingTime}`);
      return sortOrder === 'asc' 
        ? dateTimeA - dateTimeB 
        : dateTimeB - dateTimeA;
    } else if (sortBy === 'amount') {
      return sortOrder === 'asc' 
        ? a.amount - b.amount 
        : b.amount - a.amount;
    } else if (sortBy === 'patientName') {
      return sortOrder === 'asc'
        ? a.patientName.localeCompare(b.patientName)
        : b.patientName.localeCompare(a.patientName);
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
  
  const handleViewBooking = (booking) => {
    setCurrentBooking(booking);
    setShowViewModal(true);
  };
  
  const handleAddNewBooking = () => {
    const initialFormData = {
      patientName: '',
      patientPhone: '',
      pickupLocation: '',
      destinationLocation: '',
      bookingDate: new Date().toISOString().split('T')[0],
      bookingTime: '12:00',
      amount: '',
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
  
  const handleDeleteInit = (booking) => {
    setBookingToDelete(booking);
    setShowDeleteConfirm(true);
  };
  
  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/private-services/${bookingToDelete._id}`);
      
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
      
      const response = await axios.put(`/api/private-services/${bookingToUpdateStatus._id}`, updateData);
      
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
  
  const getStatusStyle = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    if (!statusOption) return { icon: faClock, color: 'secondary' };
    return statusOption;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.cityId) {
        alert('Vă rugăm să selectați un oraș pentru programare!');
        return;
      }
      
      const notesWithPatient = `Pacient: ${formData.patientName}, Telefon: ${formData.patientPhone}, ${formData.notes || ''}`;
      
      const combinedDate = new Date(`${formData.bookingDate}T${formData.bookingTime}`);
      
      const privateServiceData = {
        pickupPoint: formData.pickupLocation,
        dropoffPoint: formData.destinationLocation,
        amount: parseInt(formData.amount),
        distance: 0,
        vehicle: user.defaultVehicle || "616fabc30f15d80d3f71e554",
        city: formData.cityId,
        status: mapFrontendStatus(formData.status),
        notes: notesWithPatient,
        date: combinedDate
      };
      
      console.log('Trimit date privind programarea:', privateServiceData);
      
      const response = await axios.post('/api/private-services', privateServiceData);
      
      const createdService = response.data.data;
      
      const selectedCity = cities.find(city => city._id === formData.cityId);
      const cityName = selectedCity ? selectedCity.name : 'Necunoscut';
      
      const newBooking = {
        _id: createdService._id,
        patientName: formData.patientName,
        patientPhone: formData.patientPhone,
        pickupLocation: createdService.pickupPoint,
        destinationLocation: createdService.dropoffPoint,
        bookingDate: formData.bookingDate,
        bookingTime: formData.bookingTime,
        amount: createdService.amount,
        city: cityName,
        cityId: formData.cityId,
        assistantName: 'Nealocat',
        assistantId: null,
        status: formData.status,
        notes: formData.notes
      };
      
      setBookings([newBooking, ...bookings]);
      setShowAddModal(false);
      
      setFormData({
        patientName: '',
        patientPhone: '',
        pickupLocation: '',
        destinationLocation: '',
        bookingDate: new Date().toISOString().split('T')[0],
        bookingTime: '12:00',
        amount: '',
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
              placeholder="Nume pacient, telefon, locație..."
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
              <option value="amount">Sumă</option>
              <option value="patientName">Nume pacient</option>
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
              Adaugă programare
            </button>
          </div>
        </div>
      </div>
    </div>
  );const renderBookingsTable = () => (
    <div className="content-card">
      <h5 className="mb-4">
        <FontAwesomeIcon icon={faAmbulance} className="me-2" />
        Programări Private ({filteredBookings.length})
      </h5>
      
      <div className="table-responsive">
        <table className="table table-hover booking-table">
          <thead>
            <tr>
              <th>Pacient</th>
              <th>Locații</th>
              <th>Data și ora</th>
              <th>Sumă</th>
              <th>Status</th>
              {isAdmin && <th>Asistent</th>}
              <th>Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map(booking => {
              const statusStyle = getStatusStyle(booking.status);
              
              return (
                <tr key={booking._id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="me-2 patient-avatar">
                        <FontAwesomeIcon icon={faUser} />
                      </div>
                      <div>
                        <div className="fw-bold">{booking.patientName}</div>
                        <div className="small text-muted">
                          <FontAwesomeIcon icon={faPhone} className="me-1" />
                          {booking.patientPhone}
                        </div>
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
                      {formatDateTime(booking.bookingDate, booking.bookingTime)}
                    </div>
                  </td>
                  <td>
                    <div className="fw-bold text-success amount-badge">
                      <FontAwesomeIcon icon={faMoneyBillWave} className="me-1" />
                      {booking.amount} Lei
                    </div>
                  </td>
                  <td>
                    <div className={`badge rounded-pill text-bg-${statusStyle.color}`}>
                      <FontAwesomeIcon icon={statusStyle.icon} className="me-1" />
                      {booking.status}
                    </div>
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
                      
                      {isAdmin && (
                        <>
                          <button 
                              className="btn btn-sm btn-warning me-1"
                              onClick={() => handleEditInit(booking)}
                              title="Editează programare"
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </button>
                          
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteInit(booking)}
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
          <p className="text-muted">Nu există programări înregistrate.</p>
          <button 
            className="btn btn-success mt-3"
            onClick={handleAddNewBooking}
          >
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Adaugă prima programare
          </button>
        </div>
      )}
    </div>
  );
  

  // Adaugă această funcție pentru a randa modalul de editare
const renderEditBookingModal = () => (
    <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered className="booking-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faPen} className="me-2" />
          Editează programare
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
              <div className="col-md-6">
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
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Număr telefon pacient *</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="patientPhone"
                    value={formData.patientPhone}
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
              <div className="col-md-3">
                <Form.Group className="mb-3">
                  <Form.Label>Data *</Form.Label>
                  <Form.Control 
                    type="date" 
                    name="bookingDate"
                    value={formData.bookingDate}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-3">
                <Form.Group className="mb-3">
                  <Form.Label>Ora *</Form.Label>
                  <Form.Control 
                    type="time" 
                    name="bookingTime"
                    value={formData.bookingTime}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-3">
                <Form.Group className="mb-3">
                  <Form.Label>Sumă (Lei) *</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-3">
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

  const renderAddBookingModal = () => (
    <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" centered className="booking-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Adaugă programare privată
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
              <div className="col-md-6">
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
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Număr telefon pacient *</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="patientPhone"
                    value={formData.patientPhone}
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
              <div className="col-md-3">
                <Form.Group className="mb-3">
                  <Form.Label>Data *</Form.Label>
                  <Form.Control 
                    type="date" 
                    name="bookingDate"
                    value={formData.bookingDate}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-3">
                <Form.Group className="mb-3">
                  <Form.Label>Ora *</Form.Label>
                  <Form.Control 
                    type="time" 
                    name="bookingTime"
                    value={formData.bookingTime}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-3">
                <Form.Group className="mb-3">
                  <Form.Label>Sumă (Lei) *</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-3">
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
          disabled={loadingMembers || loadingCities}
        >
          Salvează programare
        </Button>
      </Modal.Footer>
    </Modal>
  );
  
  const renderViewBookingModal = () => (
    <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered className="booking-modal">
      <Modal.Header closeButton>
        <Modal.Title>Detalii programare</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {currentBooking && (
          <div className="booking-details">
            <div className="mb-4">
              <h5 className="mb-3">Informații pacient</h5>
              <p><strong>Nume:</strong> {currentBooking.patientName}</p>
              <p><strong>Telefon:</strong> {currentBooking.patientPhone}</p>
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
                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                <strong>Data și ora:</strong> {formatDateTime(currentBooking.bookingDate, currentBooking.bookingTime)}
              </p>
              <p>
                <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                <strong>Sumă:</strong> {currentBooking.amount} Lei
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
            Sunteți sigur că doriți să ștergeți programarea pentru <strong>{bookingToDelete.patientName}</strong> din data <strong>{formatDateTime(bookingToDelete.bookingDate, bookingToDelete.bookingTime)}</strong>?
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
            
            {/* Panou de informații utilizator simplificat - doar numele și orașul */}
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
                            Selectați cine a finalizat cursa:
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
  
  return (
    <Layout>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>
            <FontAwesomeIcon icon={faAmbulance} className="me-2" />
            Programări Private
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
        {renderDeleteConfirmModal()}
        {renderStatusModal()}
        {renderEditBookingModal()}
      </div>
    </Layout>
  );
};

export default PrivateBookings;