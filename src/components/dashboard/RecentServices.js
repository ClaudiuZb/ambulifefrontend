import React from 'react';
import ServiceItem from '../common/ServiceItem';
import { 
  faAmbulance, 
  faHospital, 
  faHeartbeat, 
  faCalendarAlt 
} from '@fortawesome/free-solid-svg-icons';

const RecentServices = ({ title }) => {
  // Mock data - vom înlocui cu date reale din API
  const services = [
    {
      id: 1,
      icon: faAmbulance,
      title: 'Transport privat',
      info: 'Suceava → Spital Județean',
      amount: '350 Lei',
      iconBgColor: 'var(--primary-color)'
    },
    {
      id: 2,
      icon: faHospital,
      title: 'Serviciu CNAS',
      info: 'Botoșani → Centru Medical',
      amount: 'Decontat',
      iconBgColor: 'var(--secondary-color)'
    },
    {
      id: 3,
      icon: faHeartbeat,
      title: 'Serviciu PNCC',
      info: 'Suceava → Centru Oncologic',
      amount: 'Decontat',
      iconBgColor: 'var(--accent-color)'
    },
    {
      id: 4,
      icon: faCalendarAlt,
      title: 'Eveniment sportiv',
      info: 'Stadion Municipal Suceava',
      amount: '1,200 Lei',
      iconBgColor: 'var(--success-color)'
    }
  ];
  
  return (
    <div className="recent-services">
      <h5 className="mb-3">{title || 'Servicii recente'}</h5>
      
      {services.map(service => (
        <ServiceItem 
          key={service.id}
          icon={service.icon}
          title={service.title}
          info={service.info}
          amount={service.amount}
          iconBgColor={service.iconBgColor}
        />
      ))}
    </div>
  );
};

export default RecentServices;