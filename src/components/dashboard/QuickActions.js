import React from 'react';
import ActionButton from '../common/ActionButton';
import { 
  faAmbulance, 
  faHospital, 
  faCamera, 
  faWallet 
} from '@fortawesome/free-solid-svg-icons';

const QuickActions = () => {
  return (
    <div className="quick-actions">
      <h5 className="mb-4">Acțiuni rapide</h5>
      <div className="row g-4">
        <div className="col-6 col-md-3">
          <ActionButton 
            icon={faAmbulance} 
            title="Adaugă Transport Privat" 
            to="/services/private/add" 
          />
        </div>
        <div className="col-6 col-md-3">
          <ActionButton 
            icon={faHospital} 
            title="Adaugă Document CNAS" 
            to="/services/cnas/add" 
          />
        </div>
        <div className="col-6 col-md-3">
          <ActionButton 
            icon={faCamera} 
            title="Încarcă Bon Carburant" 
            to="/fuel/add" 
          />
        </div>
        <div className="col-6 col-md-3">
          <ActionButton 
            icon={faWallet} 
            title="Înregistrează Cash Flow" 
            to="/cash-flow/add" 
          />
        </div>
      </div>
    </div>
  );
};

export default QuickActions;