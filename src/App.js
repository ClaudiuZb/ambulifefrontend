import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './redux/store';
import { loadUser } from './redux/actions/authActions';
import setAuthToken from './utils/setAuthToken';
import './axiosConfig'; 
// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tracking from './pages/Tracking';
import Users from './pages/management/Users';
import UserForm from './pages/management/UserForm';
import NotFound from './pages/NotFound';
import PrivateBookings from './pages/bookings/PrivateBookings';
import CNASBookings from './pages/bookings/CnasBookings';
import PNCCBookings from './pages/bookings/PNCCBookings';
import Events from './pages/bookings/Events';
import Fuel from './pages/management/Fuel'; 
import CashFlow from './pages/management/CashFlow'; 
import Medicaments from './pages/management/Medicaments'; 
import AmbulanceService from './pages/management/AmbulanceService'; 
import MechanicDashboard from './pages/dashboards/MechanicDashboard'; 
import Chat from './pages/Chat'; // Import pentru noua pagină Chat


// Routes
import PrivateRoute from './components/routing/PrivateRoute';
import AdminRoute from './components/routing/AdminRoute';

// Check if token is in localStorage
if (localStorage.token) {
  setAuthToken(localStorage.token);
}

const App = () => {
  useEffect(() => {
    store.dispatch(loadUser());
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          
          {/* Dashboard */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          
          {/* Mechanic Dashboard */}
          <Route 
            path="/mechanic/dashboard" 
            element={
              <PrivateRoute>
                <MechanicDashboard />
              </PrivateRoute>
            } 
          />
          
          {/* Chat Page */}
          <Route 
            path="/chat" 
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            } 
          />
          
          {/* Ambulance Service Management */}
          <Route 
            path="/mechanic/service" 
            element={
              <PrivateRoute>
                <AmbulanceService />
              </PrivateRoute>
            } 
          />
          
          {/* Single Ambulance Service Record View - for detailed view of a specific record */}
          <Route 
            path="/mechanic/service/:id" 
            element={
              <PrivateRoute>
                <AmbulanceService />
              </PrivateRoute>
            } 
          />
          
          {/* Tracking */}
          <Route 
            path="/tracking" 
            element={
              <PrivateRoute>
                <Tracking />
              </PrivateRoute>
            } 
          />
          
          {/* Services */}
          <Route 
            path="/services/private" 
            element={
              <PrivateRoute>
                <PrivateBookings />
              </PrivateRoute>
            } 
          />
          
          {/* CNAS Services */}
          <Route 
            path="/services/cnas" 
            element={
              <PrivateRoute>
                <CNASBookings />
              </PrivateRoute>
            } 
          />
          
          {/* PNCC Services */}
          <Route 
            path="/services/pncc" 
            element={
              <PrivateRoute>
                <PNCCBookings />
              </PrivateRoute>
            } 
          />
          
          {/* Events */}
          <Route 
            path="/services/events" 
            element={
              <PrivateRoute>
                <Events />
              </PrivateRoute>
            } 
          />
          
          {/* Fuel Management */}
          <Route 
            path="/management/fuel" 
            element={
              <PrivateRoute>
                <Fuel />
              </PrivateRoute>
            } 
          />
          
          {/* Cash Flow Management */}
          <Route 
            path="/management/cash-flow" 
            element={
              <PrivateRoute>
                <CashFlow />
              </PrivateRoute>
            } 
          />
          
          {/* Medicaments Management */}
          <Route 
            path="/management/medicaments" 
            element={
              <PrivateRoute>
                <Medicaments />
              </PrivateRoute>
            } 
          />
          
          {/* Ambulance Service Management - through /management path (pentru compatibilitate cu sidebar-urile) */}
          <Route 
            path="/management/service" 
            element={
              <PrivateRoute>
                <AmbulanceService />
              </PrivateRoute>
            } 
          />
          
          {/* User Management - Admin Only */}
          <Route 
            path="/users" 
            element={
              <AdminRoute>
                <Users />
              </AdminRoute>
            } 
          />
          
          <Route 
            path="/users/add" 
            element={
              <AdminRoute>
                <UserForm />
              </AdminRoute>
            } 
          />
          
          <Route 
            path="/users/edit/:id" 
            element={
              <AdminRoute>
                <UserForm />
              </AdminRoute>
            } 
          />
          
          {/* 404 Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </Provider>
  );
};

export default App;